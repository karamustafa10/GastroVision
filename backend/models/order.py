class Order:
    """
    Represents an order placed at a table in the restaurant.
    """
    def __init__(self, order_id, table_id, waiter_id, food_id, food_name, quantity, price, timestamp):
        self.order_id = order_id      # Unique identifier for the order
        self.table_id = table_id      # Table where the order was placed
        self.waiter_id = waiter_id    # Waiter responsible for the order
        self.food_id = food_id        # Food item ordered
        self.food_name = food_name    # Name of the food item
        self.quantity = quantity      # Quantity ordered
        self.price = price            # Total price
        self.timestamp = timestamp    # Time when the order was placed

    def to_dict(self):
        """
        Convert the Order object to a dictionary for database insertion.
        """
        return {
            'order_id': self.order_id,
            'table_id': self.table_id,
            'waiter_id': self.waiter_id,
            'food_id': self.food_id,
            'food_name': self.food_name,
            'quantity': self.quantity,
            'price': self.price,
            'timestamp': self.timestamp
        } 