from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from pulp import *
from monthly import load_model

app = FastAPI()

# Slotting fee dictionary
slotting_fee = {
    'A': {'1': 5500, '2': 4500, '3': 5000, '4': 4500, '5': 5500},  # Top row
    'B': {'1': 7200, '2': 6000, '3': 6600, '4': 6000, '5': 7200},  # High row
    'C': {'1': 10000, '2': 8500, '3': 9400, '4': 8500, '5': 10000},  # Eye-level
    'D': {'1': 6000, '2': 5000, '3': 5500, '4': 5000, '5': 6000},   # Low row
    'E': {'1': 4500, '2': 3800, '3': 4200, '4': 3800, '5': 4500}    # Bottom row
}

class RequestFormat(BaseModel):
    product_name: str

def call_internal_trained_model(product_name):
    model = load_model("saved_models/grid_sales_model")
    # Make predictions with just the product name
    predictions = model.predict_sales(product_name)
    predictions_dict = dict(zip(predictions['Grid Position'], predictions['Predicted Monthly Sales']))
    # Sort and keep top 5 items
    top_5 = dict(sorted(predictions_dict.items(), key=lambda x: x[1], reverse=True)[:5])
    # Multiply top 5 values by 3
    for k in top_5:
        top_5[k] *= 3
    return top_5

@app.post("/")
def main(request: RequestFormat):
    try:
        target_grids_with_units = call_internal_trained_model(request.product_name)
        max_budget = 300
        data = pd.read_csv("data.csv")
        #print(f"Loaded {len(data)} rows from {data_file}")

        # Extract target grids
        target_grids = list(target_grids_with_units.keys())
        print(f"Target grid positions: {target_grids}")

        # Filter data for the specific product
        product_data = data[data['Product Name'] == request.product_name]

        if len(product_data) == 0:
            return {
                'status': 'Error',
                'message': f"No data found for product '{request.product_name}'"
            }

        print(f"Found {len(product_data)} rows for product '{request.product_name}'")

        # Get product line for this product
        product_line = product_data['Product Line'].iloc[0]
        print(f"Product line: {product_line}")

        # Calculate product metrics
        avg_profit_per_unit = product_data['Total Profit ($)'].mean() / product_data['Quantity'].mean()
        avg_margin = product_data['Profit Margin (%)'].mean()
        # Use Product Size Category instead of Shelf Space Required
        product_size = product_data['Product Size Category'].iloc[0]
        avg_velocity = product_data['Product Sales Velocity'].mean()
        competitor_present = 'Yes' if any(product_data['Competitor Presence'] == 'Yes') else 'No'
        buying_decision = product_data['Buying Decision'].iloc[0]  # Use the first occurrence

        # Calculate predicted sales for each grid position
        predicted_sales = {}
        all_grid_positions = {}

        # Generate all possible grid positions
        for shelf in ['A', 'B', 'C', 'D', 'E']:
            for col in ['1', '2', '3', '4', '5']:
                grid = shelf + col
                all_grid_positions[grid] = 0

        # Fill in predicted sales where we have data
        for grid in all_grid_positions.keys():
            grid_data = product_data[product_data['Grid Position'] == grid]

            if len(grid_data) > 0:
                predicted_sales[grid] = grid_data['Quantity'].mean()
            else:
                # If no data for this specific grid, use average for product
                predicted_sales[grid] = product_data['Quantity'].mean() * 0.5  # Conservative estimate

        # Print predicted sales for target grids
        #print("\nPredicted sales for target grid positions:")
        for grid in target_grids:
            print(f"  {grid}: {predicted_sales.get(grid, 0):.2f} units")

        # Calculate net profit for each grid and check for positive net profit
        grid_profits = {}
        positive_profit_grids = []

        for grid in target_grids:
            shelf, col = grid[0], grid[1]
            sales = predicted_sales.get(grid, 0)
            revenue = sales * avg_profit_per_unit
            fee = slotting_fee[shelf][col]
            net_profit = revenue - fee

            grid_profits[grid] = net_profit

            if net_profit > 0:
                positive_profit_grids.append(grid)

        # Print net profit analysis
        #print("\nNet profit analysis for target grid positions:")
        for grid in target_grids:
            sales = predicted_sales.get(grid, 0)
            revenue = sales * avg_profit_per_unit
            fee = slotting_fee[grid[0]][grid[1]]
            net = grid_profits[grid]
            print(f"  {grid}: Sales={sales:.2f}, Revenue=${revenue:.2f}, Fee=${fee:.2f}, Net=${net:.2f}")

        # Check if we have any positive profit grid positions
        if not positive_profit_grids:
            #print("\nWarning: No grid positions found with positive net profit!")
            # For this special case, we'll boost the sales estimate to make optimization possible
            # This is a temporary measure to ensure we still get results
            boost_factor = 1.2  # Increase predicted sales by 20%
            #print(f"Boosting sales estimates by {(boost_factor-1)*100}% to find feasible solutions")

            for grid in target_grids:
                predicted_sales[grid] *= boost_factor
                shelf, col = grid[0], grid[1]
                sales = predicted_sales.get(grid, 0)
                revenue = sales * avg_profit_per_unit
                fee = slotting_fee[shelf][col]
                net_profit = revenue - fee

                grid_profits[grid] = net_profit

                if net_profit > 0:
                    positive_profit_grids.append(grid)

            # If we still don't have any positive profit grids, prioritize by least negative
            if not positive_profit_grids:
                #print("Still no positive profit grids after boosting. Using least negative grids.")
                grid_items = sorted(grid_profits.items(), key=lambda x: x[1], reverse=True)
                top_grids = grid_items[:3]

                selected_positions = [g[0] for g in top_grids]

                # Print the shelf layout directly
                #print("\nRecommended shelf layout:")
                #print_shelf_layout(selected_positions)

                # Calculate metrics for the selected grids
                total_sales = sum(predicted_sales.get(pos, 0) for pos in selected_positions)
                total_fees = sum(slotting_fee[pos[0]][pos[1]] for pos in selected_positions)
                total_profit = sum(grid_profits[pos] for pos in selected_positions)

                # Print detailed information for each selected grid
                #print("\nTop 3 grid positions (sorted by profit):")
                for i, pos in enumerate(selected_positions):
                    sales = predicted_sales.get(pos, 0)
                    revenue = sales * avg_profit_per_unit
                    fee = slotting_fee[pos[0]][pos[1]]
                    net = grid_profits[pos]
                    print(f"{i+1}. Position {pos}: Sales={sales:.2f} units, Revenue=${revenue:.2f}, Fee=${fee:.2f}, Net=${net:.2f}")

                #print(f"\nTotal expected sales: {total_sales:.2f} units")
                #print(f"Total slotting fees: ${total_fees:.2f}")
                #print(f"Total expected profit: ${total_profit:.2f}")

                return {
                    'selected_positions': selected_positions,
                }

        # Create the LP model
        model = LpProblem(name=f"{request.product_name}_Optimization", sense=LpMaximize)

        # Decision variables: X[grid] = 1 if product is placed in position grid, 0 otherwise
        X = {}
        for grid in all_grid_positions.keys():
            X[grid] = LpVariable(f"X_{grid}", cat='Binary')

        # Objective function: Maximize (Predicted_Sales × Profit_Margin - Slotting_Fee)
        objective_terms = []

        for grid in all_grid_positions.keys():
            if grid in target_grids:
                shelf, col = grid[0], grid[1]
                sales = predicted_sales.get(grid, 0)
                profit = sales * avg_profit_per_unit
                fee = slotting_fee[shelf][col]

                net_profit = profit - fee

                # Add a small sales velocity bonus to break ties
                velocity_bonus = 0.1 * avg_velocity if avg_velocity > 5 else 0

                objective_terms.append((net_profit + velocity_bonus) * X[grid])

        model += lpSum(objective_terms)

        # CONSTRAINTS

        # 1. Must place the product in at least 1 position
        model += (lpSum([X[grid] for grid in target_grids]) >= 1, "Minimum_Placement")

        # 2. Maximum of 3 placements (changed from 4)
        model += (lpSum([X[grid] for grid in all_grid_positions.keys()]) <= 3, "Maximum_Placement")

        # 3. Can only place in the specified target grids
        for grid in all_grid_positions.keys():
            if grid not in target_grids:
                model += (X[grid] == 0, f"Not_Target_{grid}")

        # 4. Budget constraint
        budget_terms = []
        for grid in target_grids:
            shelf, col = grid[0], grid[1]
            budget_terms.append(slotting_fee[shelf][col] * X[grid])
        model += (lpSum(budget_terms) <= max_budget, "Budget_Constraint")

        # 5. Additional constraint: At least one position must have positive net profit
        # This ensures we don't select only negative profit positions
        if positive_profit_grids:
            model += (lpSum([X[grid] for grid in positive_profit_grids]) >= 1, "Positive_Profit_Constraint")

        # Constraints specific to product characteristics

        # Check if constraints are compatible with target grids
        has_c_shelf = any(grid.startswith('C') for grid in target_grids)
        has_strategic = any(grid.startswith('C') or grid.endswith('1') or grid.endswith('5') for grid in target_grids)

        # 6. Profit Margin Prioritization
        if avg_margin > 30 and has_c_shelf:
            eye_level_terms = []
            for grid in target_grids:
                if grid.startswith('C'):  # Eye-level positions
                    eye_level_terms.append(X[grid])
            if eye_level_terms:
                model += (lpSum(eye_level_terms) >= 1, "High_Margin_Placement")

        # 7. Competitor Response
        if competitor_present == 'Yes' and has_c_shelf:
            competitor_terms = []
            for grid in target_grids:
                if grid.startswith('C'):  # Eye-level positions
                    competitor_terms.append(X[grid])
            if competitor_terms:
                model += (lpSum(competitor_terms) >= 1, "Competitor_Response")

        # 8. Product Size Placement (using Product Size Category)
        if product_size == 'Large':
            large_product_terms = []
            valid_shelves = ['A', 'E']  # Top and bottom shelves for large products
            for grid in target_grids:
                if grid[0] in valid_shelves:
                    large_product_terms.append(X[grid])
            if large_product_terms:
                model += (lpSum(large_product_terms) >= 1, "Large_Product_Placement")

        # 9. Product Visibility for Small Items
        if product_size == 'Small':
            small_product_terms = []
            valid_shelves = ['B', 'C', 'D']  # Middle shelves for small products
            for grid in target_grids:
                if grid[0] in valid_shelves:
                    small_product_terms.append(X[grid])
            if small_product_terms:
                model += (lpSum(small_product_terms) >= 1, "Small_Product_Placement")

        # 10. Impulse Purchase Products
        if buying_decision == 'Impulsive' and has_strategic:
            impulse_terms = []
            for grid in target_grids:
                if grid.startswith('C') or grid.endswith('1') or grid.endswith('5'):
                    impulse_terms.append(X[grid])
            if impulse_terms:
                model += (lpSum(impulse_terms) >= 1, "Impulse_Placement")

        # Solve the model
        solver = PULP_CBC_CMD(msg=False)
        result = model.solve(solver)

        # Check solution status
        print(f"\nSolution Status: {LpStatus[model.status]}")

        if LpStatus[model.status] != 'Optimal':
            print("No optimal solution found with all constraints. Trying with relaxed constraints...")

            # Create a simpler model with relaxed constraints
            simple_model = LpProblem(f"Simple_{request.product_name}_Optimization", LpMaximize)

            # Keep the same objective function
            simple_model += lpSum(objective_terms)

            # Include only essential constraints
            # 1. Must place the product in at least 1 position
            simple_model += (lpSum([X[grid] for grid in target_grids]) >= 1, "Minimum_Placement")

            # 2. Maximum of 3 placements
            simple_model += (lpSum([X[grid] for grid in all_grid_positions.keys()]) <= 3, "Maximum_Placement")

            # 3. Can only place in the specified target grids
            for grid in all_grid_positions.keys():
                if grid not in target_grids:
                    simple_model += (X[grid] == 0, f"Not_Target_{grid}")

            # 4. Budget constraint
            simple_model += (lpSum(budget_terms) <= max_budget, "Budget_Constraint")

            # 5. If possible, include the positive profit constraint
            if positive_profit_grids:
                simple_model += (lpSum([X[grid] for grid in positive_profit_grids]) >= 1, "Positive_Profit_Constraint")

            # If product is impulsive, prioritize strategic positions
            if buying_decision == 'Impulsive' and has_strategic:
                impulse_terms = []
                for grid in target_grids:
                    if grid.startswith('C') or grid.endswith('1') or grid.endswith('5'):
                        impulse_terms.append(X[grid])
                if impulse_terms:
                    simple_model += (lpSum(impulse_terms) >= 1, "Impulse_Placement")

            # Solve the simpler model
            result = simple_model.solve(solver)

            if LpStatus[simple_model.status] != 'Optimal':
                print("Still no optimal solution. Selecting the best grid positions based on net profit...")

                # Sort grid positions by net profit
                grid_items = sorted(grid_profits.items(), key=lambda x: x[1], reverse=True)
                top_grids = grid_items[:3]

                selected_positions = [g[0] for g in top_grids]

                # Print the shelf layout directly
                #print("\nRecommended shelf layout:")
                #print_shelf_layout(selected_positions)

                # Calculate metrics for the selected grids
                total_sales = sum(predicted_sales.get(pos, 0) for pos in selected_positions)
                total_fees = sum(slotting_fee[pos[0]][pos[1]] for pos in selected_positions)
                total_profit = sum(grid_profits[pos] for pos in selected_positions)

                # Print detailed information for each selected grid
                print("\nTop 3 grid positions (sorted by profit):")
                for i, pos in enumerate(selected_positions):
                    sales = predicted_sales.get(pos, 0)
                    revenue = sales * avg_profit_per_unit
                    fee = slotting_fee[pos[0]][pos[1]]
                    net = grid_profits[pos]
                    print(f"{i+1}. Position {pos}: Sales={sales:.2f} units, Revenue=${revenue:.2f}, Fee=${fee:.2f}, Net=${net:.2f}")

                print(f"\nTotal expected sales: {total_sales:.2f} units")
                print(f"Total slotting fees: ${total_fees:.2f}")
                print(f"Total expected profit: ${total_profit:.2f}")

                return {
                    'selected_positions': selected_positions,
                }

            model = simple_model

        # Extract the solution
        selected_positions = []
        for grid in all_grid_positions.keys():
            if value(X[grid]) == 1:
                selected_positions.append(grid)

        # Calculate total predicted sales and total slotting fees
        total_sales = sum(predicted_sales.get(pos, 0) for pos in selected_positions)
        total_fees = sum(slotting_fee[pos[0]][pos[1]] for pos in selected_positions)
        total_profit = sum((predicted_sales.get(pos, 0) * avg_profit_per_unit - slotting_fee[pos[0]][pos[1]]) for pos in selected_positions)

        print(f"Objective Value: ${value(model.objective):.2f}")
        print(f"Total Expected Profit: ${total_profit:.2f}")

        # Print the shelf layout directly
        print("\nRecommended shelf layout:")
        #print_shelf_layout(selected_positions)

        # Print detailed information for each selected grid
        print("\nSelected Grid Positions:")
        for i, pos in enumerate(selected_positions):
            sales = predicted_sales.get(pos, 0)
            profit = sales * avg_profit_per_unit
            fee = slotting_fee[pos[0]][pos[1]]
            net = profit - fee
            print(f"{i+1}. Position {pos}: Sales={sales:.2f} units, Revenue=${profit:.2f}, Fee=${fee:.2f}, Net=${net:.2f}")

        print(f"\nTotal expected sales: {total_sales:.2f} units")
        print(f"Total slotting fees: ${total_fees:.2f}")
        print(f"Total expected profit: ${total_profit:.2f}")

        return {
            'selected_positions': selected_positions,
        }
    except Exception as e:
        return {
            'status': 'Error',
            'message': f"An error occurred: {str(e)}"
        }