# 🚀 Guide de Setup Rapide

## 1. Configuration initiale

```bash
# 1. Copier la configuration d'exemple
cp config/config.example.json config/config.json

# 2. Éditer avec vos paramètres
nano config/config.json
```

## 2. Paramètres à configurer

Remplacez dans `config/config.json` :

- `"123456789012"` → Votre AWS Account ID
- `"votre-domaine.fr"` → Votre domaine
- `"votre-email@gmail.com"` → Votre email de destination

## 3. Installation et déploiement

```bash
# Installer les dépendances
yarn install

# Déployer directement (recommandé)
npx cdk deploy

# Ou si vous préférez compiler d'abord
yarn build && npx cdk deploy
```

## 4. Verification

1. Vérifiez dans la console AWS SES que votre domaine est vérifié
2. Testez en envoyant un email à `contact@votre-domaine.fr`
3. Vérifiez la réception sur votre email de destination

## ⚠️ Important

- Le fichier `config/config.json` ne sera **jamais** commité sur Git
- Gardez vos credentials AWS sécurisés
- Vérifiez que votre domaine a le bon enregistrement MX

## 💡 Notes sur les simplifications

- **Plus de scripts raccourcis** : Utilisez directement `npx cdk deploy` au lieu de `npm run deploy`
- **Compilation automatique** : CDK utilise `ts-node` pour compiler à la volée
- **Code plus simple** : Configuration chargée une seule fois, moins de duplication