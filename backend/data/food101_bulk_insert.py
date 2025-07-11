import os
from pymongo import MongoClient

FOOD_CLASSES = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare', 'beet_salad', 'beignets',
    'bibimbap', 'bread_pudding', 'breakfast_burrito', 'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad',
    'carrot_cake', 'ceviche', 'cheesecake', 'cheese_plate', 'chicken_curry', 'chicken_quesadilla', 'chicken_wings',
    'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder', 'club_sandwich', 'crab_cakes', 'creme_brulee',
    'croque_madame', 'cup_cakes', 'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict', 'escargots',
    'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras', 'french_fries', 'french_onion_soup', 'french_toast',
    'fried_calamari', 'fried_rice', 'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
    'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup', 'hot_dog', 'huevos_rancheros', 'hummus',
    'ice_cream', 'lasagna', 'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup',
    'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters', 'pad_thai', 'paella', 'pancakes', 'panna_cotta',
    'peking_duck', 'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich', 'ramen', 'ravioli',
    'red_velvet_cake', 'risotto', 'samosa', 'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese',
    'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake', 'sushi', 'tacos', 'takoyaki', 'tiramisu',
    'tuna_tartare', 'waffles'
]

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['restaurant']
foods_collection = db['foods']

def get_category(name):
    # Basit kategori eşlemesi (örnek)
    if 'salad' in name or 'salata' in name:
        return 'salata'
    if 'soup' in name or 'çorba' in name:
        return 'çorba'
    if 'cake' in name or 'tatlı' in name or 'ice_cream' in name or 'baklava' in name or 'tiramisu' in name:
        return 'tatlı'
    if 'grill' in name or 'steak' in name or 'kebab' in name or 'ribs' in name or 'chop' in name:
        return 'ızgara'
    if 'curry' in name or 'ramen' in name or 'bolognese' in name or 'sulu' in name or 'soup' in name:
        return 'sulu yemek'
    return 'diğer'

def main():
    for name in FOOD_CLASSES:
        if foods_collection.find_one({'name': name}):
            print(f"{name} zaten var, atlanıyor.")
            continue
        food_doc = {
            'food_id': name,
            'name': name,
            'category': get_category(name),
            'price': 100  # Varsayılan fiyat, istenirse güncellenebilir
        }
        foods_collection.insert_one(food_doc)
        print(f"Eklendi: {name}")
    print("Tüm Food-101 yemekleri eklendi!")

if __name__ == '__main__':
    main() 