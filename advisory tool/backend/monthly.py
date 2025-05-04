"""
Grid Sales Prediction Model - Final Solution
------------------------------------------
This script uses a non-TF approach to avoid all compatibility issues with model saving.
"""

import numpy as np
import pandas as pd
import os
import joblib
import pickle
import json
import random
import warnings
warnings.filterwarnings('ignore')

# For sklearn models
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

# For XGBoost
from xgboost import XGBRegressor

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Create output directories
os.makedirs("saved_models", exist_ok=True)

# Preprocess data function
def preprocess_data(df):
    """Preprocess the dataset for training"""
    # Make a copy to avoid modifying the original
    df = df.copy()
    
    # Convert date to datetime and extract month and year
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year
    df['Month_Year'] = df['Date'].dt.strftime('%Y-%m')
    df['Month_Num'] = (df['Year'] - df['Year'].min()) * 12 + df['Month']
    
    # Extract grid components
    df['Grid_Row'] = df['Grid Position'].str[0]
    
    try:
        df['Grid_Col'] = df['Grid Position'].str[1:].astype(int)
    except ValueError:
        df['Grid_Col'] = df['Grid Position'].str.extract(r'[A-Za-z](\d+)', expand=False).fillna(1).astype(int)
        
    # Convert categorical variables
    df['Competitor_Presence_Binary'] = (df['Competitor Presence'] == 'Yes').astype(int)
    
    # Create aggregated dataset
    monthly_grid_sales = df.groupby(['Product Name', 'Grid Position', 'Month_Year', 'Month_Num']).agg({
        'Quantity': 'sum',
        'Profit Margin (%)': 'mean',
        'Total Profit ($)': 'sum',
        'Competitor_Presence_Binary': 'mean',
        'Competitor Product Impact': 'mean',
        'Product Sales Velocity': 'mean',
        'Month': 'first',
        'Year': 'first',
        'Product Line': 'first',
        'Product Size Category': 'first',
        'Grid_Row': 'first',
        'Grid_Col': 'first',
        'Buying Decision': lambda x: x.mode().iloc[0] if not x.mode().empty else 'Unknown'
    }).reset_index()
    
    # Create features for seasonality
    monthly_grid_sales['Season'] = pd.cut(
        monthly_grid_sales['Month'],
        bins=[0, 3, 6, 9, 12],
        labels=['Winter', 'Spring', 'Summer', 'Fall'],
        include_lowest=True
    )
    
    return df, monthly_grid_sales

# Engineer features function
def engineer_features(monthly_sales):
    """Create additional features for better prediction performance"""
    df = monthly_sales.copy()
    
    # Calculate grid popularity across all products
    grid_popularity = df.groupby('Grid Position')['Quantity'].sum().reset_index()
    grid_popularity.columns = ['Grid Position', 'Grid_Popularity']
    df = pd.merge(df, grid_popularity, on='Grid Position', how='left')
    
    # Calculate product popularity across all grids
    product_popularity = df.groupby('Product Name')['Quantity'].sum().reset_index()
    product_popularity.columns = ['Product Name', 'Product_Popularity']
    df = pd.merge(df, product_popularity, on='Product Name', how='left')
    
    # Grid row and column popularity
    df['Row_Popularity'] = df.groupby('Grid_Row')['Quantity'].transform('sum')
    df['Col_Popularity'] = df.groupby('Grid_Col')['Quantity'].transform('sum')
    
    # Calculate distance from center (C3)
    def calculate_grid_distance(row):
        try:
            row_num = ord(row['Grid_Row']) - ord('A') + 1
            col_num = row['Grid_Col']
            center_row, center_col = 3, 3  # C3 position
            return ((row_num - center_row) ** 2 + (col_num - center_col) ** 2) ** 0.5
        except (TypeError, ValueError):
            return 0
            
    df['Distance_From_Center'] = df.apply(calculate_grid_distance, axis=1)
    
    # Competitor impact ratio with safe division
    df['Competitor_Impact_Ratio'] = df['Competitor Product Impact'] / df['Quantity'].clip(lower=1)
    
    # Add premium location indicator
    def premium_location(row):
        row_letter = row['Grid_Row']
        col_num = row['Grid_Col']
        
        # Corners and edges are premium
        if row_letter in ['A', 'E'] or col_num in [1, 5]:
            return 1
        return 0
        
    df['Premium_Location'] = df.apply(premium_location, axis=1)
    
    # Add trend features
    df = df.sort_values(['Product Name', 'Grid Position', 'Month_Num'])
    df['Sales_Previous_Month'] = df.groupby(['Product Name', 'Grid Position'])['Quantity'].shift(1)
    df['Sales_Growth'] = df['Quantity'] - df['Sales_Previous_Month']
    df['Sales_Growth_Pct'] = df['Sales_Growth'] / df['Sales_Previous_Month'].clip(lower=1)
    
    # Fill NaN values
    df['Sales_Previous_Month'] = df['Sales_Previous_Month'].fillna(df['Quantity'])
    df['Sales_Growth'] = df['Sales_Growth'].fillna(0)
    df['Sales_Growth_Pct'] = df['Sales_Growth_Pct'].fillna(0)
    
    return df

# Ensemble model class (no TensorFlow dependencies)
class GridSalesEnsembleModel:
    def __init__(self):
        # Internal models
        self.xgb_model = None
        self.rf_model_1 = None
        self.rf_model_2 = None  # Instead of neural network, use a second RF model
        
        # Preprocessor
        self.preprocessor = None
        
        # Features
        self.categorical_features = [
            'Product Line', 'Product Size Category', 'Buying Decision',
            'Season', 'Grid_Row'
        ]
        self.numerical_features = [
            'Month', 'Month_Num', 'Grid_Col', 'Competitor_Presence_Binary',
            'Competitor Product Impact', 'Product Sales Velocity',
            'Profit Margin (%)', 'Grid_Popularity', 'Product_Popularity',
            'Row_Popularity', 'Col_Popularity', 'Distance_From_Center',
            'Competitor_Impact_Ratio', 'Premium_Location',
            'Sales_Previous_Month', 'Sales_Growth', 'Sales_Growth_Pct'
        ]
        
        # Ensemble weights
        self.ensemble_weights = {
            'xgb': 0.4,
            'rf_1': 0.3,
            'rf_2': 0.3
        }
        
        # Product data storage
        self.product_data = {}
        self.all_grids = []
    
    def store_feature_info(self, data):
        """Store which features are available in the dataset"""
        # Validate that required columns exist
        self.categorical_features = [col for col in self.categorical_features if col in data.columns]
        self.numerical_features = [col for col in self.numerical_features if col in data.columns]

    def store_preprocessor(self, preprocessor):
        """Store the preprocessor"""
        self.preprocessor = preprocessor
        
    def store_product_data(self, data):
        """Store preprocessed data for each product"""
        # Store all possible grid positions
        self.all_grids = [f"{chr(65 + row)}{col + 1}" for row in range(5) for col in range(5)]
        
        # Get unique products
        unique_products = data['Product Name'].unique()
        
        # Store data for each product
        for product in unique_products:
            product_data = data[data['Product Name'] == product].copy()
            
            if not product_data.empty:
                # Get the latest month data for each grid
                latest_data = product_data.sort_values('Month_Num').groupby('Grid Position').last().reset_index()
                
                # Store this for later prediction
                self.product_data[product] = {
                    'latest_data': latest_data,
                    'all_data': product_data
                }
    
    def store_models(self, xgb_model, rf_model_1, rf_model_2):
        """Store the trained models"""
        self.xgb_model = xgb_model
        self.rf_model_1 = rf_model_1
        self.rf_model_2 = rf_model_2
        
    def predict_sales(self, product_name, grid=None):
        """Make predictions for a product using the ensemble model"""
        # Check if models are trained
        if self.xgb_model is None or self.rf_model_1 is None or self.rf_model_2 is None:
            print("Models not trained.")
            return None
        
        # Check if we have stored data for this product
        if product_name not in self.product_data:
            print(f"No data found for product: {product_name}")
            return None
        
        try:
            # If specific grid is requested, filter for that grid
            if grid is not None:
                if grid in self.all_grids:
                    grids_to_predict = [grid]
                else:
                    print(f"Invalid grid position: {grid}")
                    return None
            else:
                # Otherwise predict for all grids
                grids_to_predict = self.all_grids
            
            # Get stored data for this product
            product_info = self.product_data[product_name]
            latest_data = product_info['latest_data']
            
            # Create prediction data for each grid
            prediction_rows = []
            for grid_pos in grids_to_predict:
                # Check if we have historical data for this grid
                grid_data = latest_data[latest_data['Grid Position'] == grid_pos]
                
                if len(grid_data) > 0:
                    # Use actual data for this grid
                    row = grid_data.iloc[0].copy()
                else:
                    # Use data from another grid as template and modify
                    if len(latest_data) > 0:
                        row = latest_data.iloc[0].copy()
                        row['Grid Position'] = grid_pos
                        row['Grid_Row'] = grid_pos[0]
                        try:
                            row['Grid_Col'] = int(grid_pos[1:])
                        except:
                            row['Grid_Col'] = 1  # Default
                    else:
                        print(f"No data available for product {product_name}")
                        return None
                
                # Update grid-specific features
                try:
                    row['Distance_From_Center'] = ((ord(grid_pos[0]) - ord('C')) ** 2 + (int(grid_pos[1:]) - 3) ** 2) ** 0.5
                except:
                    row['Distance_From_Center'] = 0
                    
                row['Premium_Location'] = 1 if (grid_pos[0] in ['A', 'E'] or grid_pos[1:] in ['1', '5']) else 0
                
                prediction_rows.append(row)
            
            # Convert to DataFrame
            pred_df = pd.DataFrame(prediction_rows)
            
            # Get features for prediction (only available ones)
            pred_features = []
            for feat_list in [self.categorical_features, self.numerical_features]:
                for col in feat_list:
                    if col in pred_df.columns:
                        pred_features.append(col)
            
            X_pred = pred_df[pred_features]
            
            # Preprocess the data
            X_pred_processed = self.preprocessor.transform(X_pred)
            
            # Make predictions with each model
            xgb_pred = self.xgb_model.predict(X_pred_processed)
            rf_1_pred = self.rf_model_1.predict(X_pred_processed)
            rf_2_pred = self.rf_model_2.predict(X_pred_processed)
            
            # Combine for ensemble prediction
            predictions = (
                self.ensemble_weights['xgb'] * xgb_pred +
                self.ensemble_weights['rf_1'] * rf_1_pred +
                self.ensemble_weights['rf_2'] * rf_2_pred
            )
            
            # Ensure predictions are non-negative and apply amplification
            predictions = np.maximum(predictions, 0) * 1.5
            
            # Add controlled randomness for diversity
            for i in range(len(predictions)):
                if predictions[i] > 0:
                    grid_pos = grids_to_predict[i]
                    if grid_pos[0] in ['A', 'E'] or grid_pos[1:] in ['1', '5']:
                        randomness = random.uniform(-0.05, 0.15)
                    else:
                        randomness = random.uniform(-0.10, 0.10)
                    predictions[i] *= (1 + randomness)
            
            # Create results DataFrame
            results = pd.DataFrame({
                'Grid Position': grids_to_predict,
                'Predicted Monthly Sales': np.round(predictions).astype(int)
            })
            
            # Sort by predicted sales in descending order
            results = results.sort_values('Predicted Monthly Sales', ascending=False)
            
            return results
            
        except Exception as e:
            print(f"Error during prediction: {e}")
            return None

# Function to train and save the model
def train_and_save_model():
    """Train and save the ensemble model with all components"""
    print("=== Training Grid Sales Ensemble Model ===")
    
    try:
        # Load data
        print("Loading data...")
        df = pd.read_csv("data.csv")
        print(f"Data loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Preprocess data
        print("Preprocessing data...")
        raw_data, monthly_data = preprocess_data(df)
        processed_data = engineer_features(monthly_data)
        print("Data preprocessing complete.")
        
        # Create and train the model
        print("Training ensemble model...")
        
        # 1. Initialize the model
        model = GridSalesEnsembleModel()
        
        # 2. Store feature information
        model.store_feature_info(processed_data)
        
        # 3. Prepare features and preprocessor
        categorical_features = model.categorical_features
        numerical_features = model.numerical_features
        
        # Extract features for training
        X = processed_data[categorical_features + numerical_features].copy()
        y = processed_data['Quantity']
        
        # Define preprocessing steps
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        numerical_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', categorical_transformer, categorical_features),
                ('num', numerical_transformer, numerical_features)
            ])
        
        # Fit preprocessor
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_processed = preprocessor.fit_transform(X_train)
        
        # 4. Train the individual models
        
        # XGBoost
        print("Training XGBoost model...")
        xgb_model = XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        xgb_model.fit(X_train_processed, y_train)
        
        # Random Forest model 1
        print("Training Random Forest model 1...")
        rf_model_1 = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        rf_model_1.fit(X_train_processed, y_train)
        
        # Random Forest model 2 (instead of neural network)
        print("Training Random Forest model 2...")
        rf_model_2 = RandomForestRegressor(
            n_estimators=150,  # Different parameters to make it a distinct model
            max_depth=12,
            min_samples_split=5,
            random_state=43  # Different seed
        )
        rf_model_2.fit(X_train_processed, y_train)
        
        # 5. Store models, preprocessor, and product data in the model
        model.store_models(xgb_model, rf_model_1, rf_model_2)
        model.store_preprocessor(preprocessor)
        model.store_product_data(processed_data)
        
        print("Ensemble model training complete.")
        
        # 6. Save all components
        model_dir = os.path.join("saved_models", "grid_sales_model")
        os.makedirs(model_dir, exist_ok=True)
        
        # Save all models
        joblib.dump(xgb_model, os.path.join(model_dir, "xgb_model.joblib"))
        joblib.dump(rf_model_1, os.path.join(model_dir, "rf_model_1.joblib"))
        joblib.dump(rf_model_2, os.path.join(model_dir, "rf_model_2.joblib"))
        
        # Save preprocessor
        joblib.dump(preprocessor, os.path.join(model_dir, "preprocessor.joblib"))
        
        # Save product data
        serializable_product_data = {}
        for product, data_dict in model.product_data.items():
            serializable_product_data[product] = {
                'latest_data': data_dict['latest_data'].to_dict('records'),
                'all_data': data_dict['all_data'].to_dict('records') 
            }
        
        with open(os.path.join(model_dir, "product_data.pkl"), "wb") as f:
            pickle.dump(serializable_product_data, f)
        
        # Save metadata
        with open(os.path.join(model_dir, "metadata.json"), "w") as f:
            json.dump({
                "categorical_features": categorical_features,
                "numerical_features": numerical_features,
                "ensemble_weights": model.ensemble_weights,
                "all_grids": model.all_grids
            }, f, indent=4)
        
        print(f"\nModel saved to {model_dir}")
        print("The saved model components include:")
        print(f"  - XGBoost model (xgb_model.joblib)")
        print(f"  - Random Forest model 1 (rf_model_1.joblib)")
        print(f"  - Random Forest model 2 (rf_model_2.joblib)")
        print(f"  - Preprocessor (preprocessor.joblib)")
        print(f"  - Product data (product_data.pkl)")
        print(f"  - Metadata (metadata.json)")
        
    except Exception as e:
        print(f"Error during model training and saving: {e}")

# Function to load the model
def load_model(model_dir="saved_models/grid_sales_model"):
    """Load the trained model with all components"""
    print(f"Loading model from {model_dir}...")
    
    if not os.path.exists(model_dir):
        print(f"Model directory not found: {model_dir}")
        return None
    
    try:
        # Create a new model instance
        model = GridSalesEnsembleModel()
        
        # Load metadata
        with open(os.path.join(model_dir, "metadata.json"), "r") as f:
            metadata = json.load(f)
        
        # Set metadata
        model.categorical_features = metadata["categorical_features"]
        model.numerical_features = metadata["numerical_features"]
        model.ensemble_weights = metadata["ensemble_weights"]
        model.all_grids = metadata["all_grids"]
        
        # Load models
        model.xgb_model = joblib.load(os.path.join(model_dir, "xgb_model.joblib"))
        model.rf_model_1 = joblib.load(os.path.join(model_dir, "rf_model_1.joblib"))
        model.rf_model_2 = joblib.load(os.path.join(model_dir, "rf_model_2.joblib"))
        
        # Load preprocessor
        model.preprocessor = joblib.load(os.path.join(model_dir, "preprocessor.joblib"))
        
        # Load product data
        with open(os.path.join(model_dir, "product_data.pkl"), "rb") as f:
            serialized_product_data = pickle.load(f)
            
        # Convert back to DataFrame format
        model.product_data = {}
        for product, data_dict in serialized_product_data.items():
            model.product_data[product] = {
                'latest_data': pd.DataFrame(data_dict['latest_data']),
                'all_data': pd.DataFrame(data_dict['all_data'])
            }
        
        print("Model loaded successfully.")
        return model
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Function to use the loaded model
def use_saved_model():
    """Example of how to use the saved model"""
    print("\n=== Using Saved Model ===")
    
    # Load the model
    model = load_model()
    
    if model is None:
        print("Failed to load model. Make sure you've run train_and_save_model() first.")
        return
    
    # Get available products
    available_products = list(model.product_data.keys())
    
    if not available_products:
        print("No products available in the model.")
        return
    
    print(f"Available products: {available_products}")
    
    # Make predictions for first product
    sample_product = available_products[0]
    print(f"\nMaking predictions for {sample_product}...")
    
    # Predict for all grid positions
    predictions = model.predict_sales(sample_product)
    
    if predictions is not None:
        print("\nPredicted sales by grid position:")
        print(predictions.head(10))
        
        # Find best grid position
        best_grid = predictions.iloc[0]['Grid Position']
        best_sales = predictions.iloc[0]['Predicted Monthly Sales']
        print(f"\nBest grid position for {sample_product}: {best_grid} with predicted sales of {best_sales} units")
        
        # Predict for a specific grid
        center_grid = "C3"
        print(f"\nPredicting sales for {sample_product} at grid position {center_grid}...")
        center_prediction = model.predict_sales(sample_product, grid=center_grid)
        if center_prediction is not None:
            center_sales = center_prediction.iloc[0]['Predicted Monthly Sales']
            print(f"Predicted sales at {center_grid}: {center_sales} units")
    else:
        print("Prediction failed")

# Main execution
if __name__ == "__main__":
    # Choose which operation to run
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "train":
            train_and_save_model()
        elif sys.argv[1] == "predict":
            use_saved_model()
        else:
            print("Unknown command. Use 'train' or 'predict'")
    else:
        # If no arguments, ask what to do
        action = input("Enter 'train' to train the model, or 'predict' to use the saved model: ").strip().lower()
        
        if action == "train":
            train_and_save_model()
        elif action == "predict":
            use_saved_model()
        else:
            print("Unknown command. Use 'train' or 'predict'")