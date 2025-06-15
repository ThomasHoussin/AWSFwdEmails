# 📧 AWS Email Forwarder CDK

Implémentation CDK simple du tutoriel AWS pour le transfert d'emails avec SES.
Basé sur le package mature `@seeebiii/ses-email-forwarding`.

## ✨ Fonctionnalités

- ✅ **Transfert d'emails automatique** via AWS SES
- ✅ **Configuration simple** via fichier JSON
- ✅ **Vérification automatique** du domaine (Route53)
- ✅ **Multiple mappings** d'emails
- ✅ **Sécurisé** - pas de secrets dans le code
- ✅ **Déploiement en une commande**

## 🏗️ Architecture

Cette solution reproduit exactement l'architecture du [tutoriel AWS](https://aws.amazon.com/fr/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination/) :

1. **SES** reçoit l'email sur votre domaine
2. **S3** stocke temporairement l'email
3. **Lambda** traite et transfère l'email
4. **SES** envoie l'email vers la destination finale

## 🚀 Installation rapide

### 1. Cloner et installer

```bash
# Cloner le projet
git clone <votre-repo>
cd aws-email-forwarder-cdk

# Installer les dépendances
yarn install
```

### 2. Configuration

```bash
# Copier l'exemple de configuration
cp config/config.example.json config/config.json

# Éditer la configuration
nano config/config.json
```

### 3. Configurer vos paramètres

Modifiez `config/config.json` avec vos informations :

```json
{
  "account": "123456789012",           // Votre AWS Account ID
  "region": "eu-west-1",               // Région AWS
  "domainName": "mondomaine.fr",       // Votre domaine
  "fromPrefix": "noreply",             // Préfixe expéditeur
  "emailMappings": [
    {
      "receivePrefix": "contact",      // contact@mondomaine.fr
      "targetEmails": ["moi@gmail.com"]
    },
    {
      "receivePrefix": "info",         // info@mondomaine.fr
      "targetEmails": ["moi@gmail.com"]
    }
  ],
  "verifyDomain": true,                // Auto-vérification (Route53)
  "verifyTargetEmailAddresses": false
}
```

### 4. Déployer

```bash
# Option 1: Déploiement direct (recommandé)
npx cdk deploy

# Option 2: Compilation puis déploiement
yarn build
npx cdk deploy
```

## ⚙️ Configuration détaillée

### Paramètres obligatoires

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `account` | AWS Account ID | `"123456789012"` |
| `region` | Région AWS | `"eu-west-1"` |
| `domainName` | Votre domaine | `"mondomaine.fr"` |
| `fromPrefix` | Préfixe expéditeur | `"noreply"` |
| `emailMappings` | Mappings d'emails | Voir exemple ci-dessous |

### Mappings d'emails

```json
"emailMappings": [
  {
    "receivePrefix": "contact",
    "targetEmails": ["admin@gmail.com", "support@company.com"]
  },
  {
    "receivePrefix": "newsletter",
    "targetEmails": ["marketing@company.com"]
  }
]
```

### Options avancées

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `verifyDomain` | Vérification auto domaine (Route53) | `true` |
| `verifyTargetEmailAddresses` | Vérification emails destination | `false` |

## 📋 Prérequis

### AWS

- ✅ Compte AWS configuré
- ✅ CDK v2 installé : `npm install -g aws-cdk`
- ✅ Permissions AWS : SES, S3, Lambda, IAM
- ✅ Domaine possédé (Route53 recommandé)

### Local

- ✅ Node.js >= 18
- ✅ TypeScript
- ✅ AWS CLI configuré

## 🔧 Commandes utiles

```bash
# Installation
yarn install               # Installer dépendances

# CDK (commandes principales)
npx cdk deploy             # Déployer sur AWS
npx cdk synth              # Générer CloudFormation
npx cdk destroy            # Supprimer la stack
npx cdk diff               # Voir les changements

# Développement (optionnel)
yarn build                 # Compiler TypeScript
yarn watch                 # Compilation automatique
yarn test                  # Tests unitaires
```

## 🛠️ Après déploiement

### 1. Configuration DNS

Si votre domaine n'est **pas** sur Route53, ajoutez manuellement :

```
# Enregistrement MX
10 inbound-smtp.eu-west-1.amazonaws.com
```

### 2. Vérification SES

- Vérifiez que votre domaine est validé dans la console SES
- Sortez du sandbox SES si nécessaire
- Testez l'envoi d'un email

### 3. Test

Envoyez un email à `contact@votre-domaine.fr` et vérifiez la réception.

## 🔍 Dépannage

### Email pas reçu

1. ✅ Vérifiez les logs CloudWatch de la fonction Lambda
2. ✅ Vérifiez que le domaine est vérifié dans SES
3. ✅ Vérifiez l'enregistrement MX DNS
4. ✅ Vérifiez que vous n'êtes pas dans le sandbox SES

### Erreurs de déploiement

1. ✅ Vérifiez que `config/config.json` existe
2. ✅ Vérifiez les permissions AWS
3. ✅ Vérifiez que la région SES est supportée

## 🔧 Architecture simplifiée

Cette version a été **simplifiée** pour une meilleure maintenabilité :

### ✨ Améliorations apportées

- **📁 Configuration unique** : Chargée une seule fois dans `bin/email-forwarder.ts`
- **🧹 Code réduit** : -20 lignes, suppression des duplications
- **⚡ Pas de compilation obligatoire** : CDK utilise `ts-node` pour compiler à la volée
- **🎯 Scripts essentiels** : Seules les commandes nécessaires dans `package.json`

### 🚀 Avantages

- **Plus rapide** : Déploiement direct avec `npx cdk deploy`
- **Plus simple** : Moins de fichiers à maintenir
- **Plus lisible** : Code plus concis et focalisé

## 💰 Coûts

Pour 1000 emails/mois (~2KB chacun) :
- **SES** : ~0.10€
- **S3** : <0.01€
- **Lambda** : <0.01€
- **Total** : ~0.11€/mois

*Coûts hors domaine (le plus cher)*

## 🤝 Contribuer

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amélioration`)
3. Committez (`git commit -am 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amélioration`)
5. Ouvrez une Pull Request

## 📝 Licence

MIT License - voir le fichier [LICENSE](LICENSE)

## 🙏 Remerciements

- [Tutoriel AWS officiel](https://aws.amazon.com/fr/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination/)
- [@seeebiii/ses-email-forwarding](https://github.com/seeebiii/ses-email-forwarding) - Le construct CDK utilisé
- Communauté AWS CDK

---

**🚀 Prêt à déployer ?**
```bash
cp config/config.example.json config/config.json
# Éditez config.json avec vos paramètres
yarn install
npx cdk deploy
```

> 💡 **Astuce** : Plus besoin de `yarn build` ! CDK compile automatiquement avec `ts-node`.