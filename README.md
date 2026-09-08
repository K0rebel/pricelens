# PriceLens

Prosty prototyp aplikacji do przeliczania cen zagranicznych na PLN.

## Uruchomienie

Otwórz `index.html` w przeglądarce albo uruchom dowolny lokalny serwer HTTP w tym folderze. Kursy są pobierane z Frankfurter API, więc kalkulator potrzebuje połączenia z internetem. Tryb aparatu i lokalizacja GPS wymagają uruchomienia przez `https://` albo `localhost` oraz zgody użytkownika na dostęp do urządzenia.

## Zakres prototypu

- automatyczny wybór waluty na podstawie lokalizacji GPS i kraju użytkownika,
- przeliczanie wpisanej ceny na PLN,
- odświeżanie aktualnych kursów,
- wybór waluty z krajem i flagą,
- historia pięciu ostatnich przeliczeń zapisywana lokalnie,
- tryb jasny i ciemny,
- dolna nawigacja zoptymalizowana pod telefon,
- OCR ceny z obrazu kamery z użyciem Tesseract.js,
- nakładka AR pokazująca rozpoznaną cenę i przeliczenie na PLN,
- zakładka Obiektyw automatycznie uruchamia aparat w pełnoekranowym widoku.

OCR działa cyklicznie co 2,5 sekundy i wymaga połączenia z internetem przy pierwszym załadowaniu biblioteki Tesseract.js. Nakładka AR jest wizualną warstwą nad obrazem kamery; pełne śledzenie położenia etykiety w przestrzeni wymaga natywnego AR/WebXR i jest kolejnym etapem.
