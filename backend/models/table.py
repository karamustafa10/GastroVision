class Table:
    """
    Represents a table in the restaurant.
    """
    def __init__(self, table_id, waiter_id=None, status='empty', last_customer_time=None, last_waiter_time=None):
        self.table_id = table_id              # Table number or unique ID
        self.waiter_id = waiter_id            # Waiter assigned to the table
        self.status = status                  # Status: 'empty', 'occupied', 'needs_cleaning', etc.
        self.last_customer_time = last_customer_time  # Last time a customer sat at the table
        self.last_waiter_time = last_waiter_time      # Last time a waiter served the table

    def to_dict(self):
        """
        Convert the Table object to a dictionary for database insertion.
        """
        return {
            'table_id': self.table_id,
            'waiter_id': self.waiter_id,
            'status': self.status,
            'last_customer_time': self.last_customer_time,
            'last_waiter_time': self.last_waiter_time
        } 