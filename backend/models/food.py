class Food:
    """
    Represents a food item in the restaurant.
    """
    def __init__(self, food_id, name, category, price):
        self.food_id = food_id  # Unique identifier for the food
        self.name = name        # Name of the food
        self.category = category  # Category (e.g., soup, salad, dessert, grill, stew)
        self.price = price      # Price of the food

    def to_dict(self):
        """
        Convert the Food object to a dictionary for database insertion.
        """
        return {
            'food_id': self.food_id,
            'name': self.name,
            'category': self.category,
            'price': self.price
        } 