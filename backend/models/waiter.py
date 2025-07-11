class Waiter:
    """
    Represents a waiter in the restaurant.
    """
    def __init__(self, waiter_id, name, code, performance=0, interest_level=0):
        self.waiter_id = waiter_id        # Unique identifier for the waiter
        self.name = name                  # Name of the waiter
        self.code = code                  # QR code or number for the waiter
        self.performance = performance    # Performance score
        self.interest_level = interest_level  # Interest/attention level

    def to_dict(self):
        """
        Convert the Waiter object to a dictionary for database insertion.
        """
        return {
            'waiter_id': self.waiter_id,
            'name': self.name,
            'code': self.code,
            'performance': self.performance,
            'interest_level': self.interest_level
        } 