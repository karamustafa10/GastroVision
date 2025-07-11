import cv2
import os

CATEGORIES = ['corba', 'salata', 'tatli', 'izgara', 'sulu_yemek']
SAVE_DIR = 'data'

print('Yemek kategorileri:', CATEGORIES)
cat = input('Kategori seçin: ')
if cat not in CATEGORIES:
    print('Geçersiz kategori!')
    exit(1)

os.makedirs(os.path.join(SAVE_DIR, cat), exist_ok=True)

cap = cv2.VideoCapture(0)
count = 0
print('Fotoğraf çekmek için SPACE, çıkmak için ESC basın.')
while True:
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow('Kamera', frame)
    key = cv2.waitKey(1)
    if key == 27:  # ESC
        break
    elif key == 32:  # SPACE
        filename = os.path.join(SAVE_DIR, cat, f'{cat}_{count}.jpg')
        cv2.imwrite(filename, frame)
        print(f'Kaydedildi: {filename}')
        count += 1
cap.release()
cv2.destroyAllWindows() 