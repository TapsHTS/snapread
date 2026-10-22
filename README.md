# Memories Reader — photothèque Snapchat locale

1. `npm install && npm run dev` (ou la version déployée sur GitHub Pages : HTTPS requis pour l'accès aux dossiers).
2. Branchez le disque, cliquez « Choisir le dossier Snapchat » (Chrome, Edge ou Brave) et sélectionnez le dossier qui contient les archives extraites.
3. Les fichiers `AAAA-MM-JJ_<uuid>-main.jpg|mp4` (+ `-overlay.png`) sont détectés dans tous les sous-dossiers. Rien n'est copié ni envoyé : les fichiers restent sur le disque.
4. Les miniatures sont générées à la volée puis mises en cache dans le navigateur (IndexedDB) : le second lancement est instantané.

Déploiement : poussez sur `main`, activez Pages > Source « GitHub Actions ».
