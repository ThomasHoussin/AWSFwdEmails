import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailForwardingRuleSet } from '@seeebiii/ses-email-forwarding';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as path from 'path';

interface EmailForwarderStackProps extends cdk.StackProps {
  config: any;
}

export class EmailForwarderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EmailForwarderStackProps) {
    super(scope, id, props);

    const config = props.config;

    // Validation de la configuration
    this.validateConfig(config);

    // Mapper chaque domaine vers emailForwardingProps
    const emailForwardingProps = config.domains.map((domain: any) => ({
      // Nom de domaine pour recevoir/envoyer les emails
      domainName: domain.domainName,

      // Vérification automatique du domaine dans SES (nécessite Route53)
      verifyDomain: domain.verifyDomain,

      // Vérification des adresses email de destination (si pas de domaine vérifié)
      verifyTargetEmailAddresses: domain.verifyTargetEmailAddresses,

      // Préfixe pour l'adresse d'expédition (ex: noreply@domaine.fr)
      fromPrefix: domain.fromPrefix,

      // Mappings des adresses email
      emailMappings: domain.emailMappings
    }));

    // Création du système de transfert d'emails avec SES
    // On utilise une approche personnalisée pour forcer Node.js 22
    const emailForwardingRuleSet = new EmailForwardingRuleSet(this, 'EmailForwardingRuleSet', {
      // Active automatiquement le rule set (un seul peut être actif)
      enableRuleSet: true,

      // Configuration du transfert d'emails pour tous les domaines
      emailForwardingProps: emailForwardingProps
    });

    // Patch pour forcer Node.js 22.x sur la fonction lambda de transfert d'emails
    this.patchLambdaRuntime(emailForwardingRuleSet);

    // Application des règles de cycle de vie S3
    this.applyS3LifecyclePolicies(emailForwardingRuleSet);

    // Outputs utiles
    new cdk.CfnOutput(this, 'ConfiguredDomains', {
      value: config.domains.map((d: any) => d.domainName).join(', '),
      description: 'Domaines configurés pour le transfert d\'emails'
    });

    new cdk.CfnOutput(this, 'DomainsConfiguration', {
      value: JSON.stringify(config.domains.map((d: any) => ({
        domain: d.domainName,
        fromPrefix: d.fromPrefix,
        emailMappings: d.emailMappings
      })), null, 2),
      description: 'Configuration détaillée de tous les domaines'
    });
  }

  private patchLambdaRuntime(emailForwardingRuleSet: EmailForwardingRuleSet): void {
    // On parcourt tous les enfants du construct pour trouver les lambdas
    const findLambdas = (construct: Construct): lambda.Function[] => {
      const lambdas: lambda.Function[] = [];

      for (const child of construct.node.children) {
        if (child instanceof lambda.Function) {
          lambdas.push(child);
        }
        // Récursion sur les enfants
        lambdas.push(...findLambdas(child));
      }

      return lambdas;
    };

    const lambdaFunctions = findLambdas(emailForwardingRuleSet);

    for (const lambdaFunction of lambdaFunctions) {
      // On identifie la lambda de transfert d'emails par son nom ou ses propriétés
      const resourceName = lambdaFunction.node.id;

      // Si c'est la lambda de transfert d'emails (elle contient généralement "EmailForwarding" dans le nom)
      if (resourceName.includes('EmailForwarding')) {
        // On force le runtime à Node.js 22.x en accédant à la ressource CloudFormation sous-jacente
        const cfnFunction = lambdaFunction.node.defaultChild as lambda.CfnFunction;
        cfnFunction.runtime = lambda.Runtime.NODEJS_22_X.name;

        console.log(`✅ Runtime mis à jour vers Node.js 22.x pour la lambda: ${resourceName}`);
      }
    }
  }

  private validateConfig(config: any): void {
    // Vérifier que le tableau de domaines existe
    if (!config.domains || !Array.isArray(config.domains) || config.domains.length === 0) {
      throw new Error('La configuration doit contenir un tableau "domains" avec au moins un domaine');
    }

    // Valider chaque domaine
    for (const domain of config.domains) {
      const requiredFields = ['domainName', 'fromPrefix', 'emailMappings'];

      for (const field of requiredFields) {
        if (!domain[field]) {
          throw new Error(`Champ obligatoire manquant dans le domaine ${domain.domainName || 'inconnu'}: ${field}`);
        }
      }

      if (!Array.isArray(domain.emailMappings) || domain.emailMappings.length === 0) {
        throw new Error(`Au moins un mapping d'email doit être configuré pour le domaine ${domain.domainName}`);
      }

      for (const mapping of domain.emailMappings) {
        if (!mapping.receivePrefix || !mapping.targetEmails || !Array.isArray(mapping.targetEmails)) {
          throw new Error(`Chaque mapping du domaine ${domain.domainName} doit avoir un receivePrefix et un tableau targetEmails`);
        }
      }
    }
  }

  private applyS3LifecyclePolicies(emailForwardingRuleSet: EmailForwardingRuleSet): void {
    // On parcourt tous les enfants du construct pour trouver les buckets S3
    const findS3Buckets = (construct: Construct): s3.Bucket[] => {
      const buckets: s3.Bucket[] = [];

      for (const child of construct.node.children) {
        if (child instanceof s3.Bucket) {
          buckets.push(child);
        }
        // Récursion sur les enfants
        buckets.push(...findS3Buckets(child));
      }

      return buckets;
    };

    const s3Buckets = findS3Buckets(emailForwardingRuleSet);

    for (const bucket of s3Buckets) {
      const bucketName = bucket.node.id;

      // On applique les règles de cycle de vie au bucket des emails
      // (généralement il y a un seul bucket créé par la bibliothèque)
      console.log(`📧 Application des règles de cycle de vie au bucket: ${bucketName}`);

      // Définition des règles de cycle de vie
      const lifecycleRules: s3.LifecycleRule[] = [
        {
          id: 'email-lifecycle-policy',
          enabled: true,

          // Passage en Intelligent Tiering à J0
          transitions: [{
            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
            transitionAfter: cdk.Duration.days(0)
          }],

          // Suppression des objets à J90
          expiration: cdk.Duration.days(90),

          // Nettoyage des uploads multipart incomplets après 1 jour
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1)
        }
      ];

      // Application des règles au bucket via la ressource CloudFormation sous-jacente
      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.lifecycleConfiguration = {
        rules: lifecycleRules.map(rule => ({
          id: rule.id,
          status: rule.enabled ? 'Enabled' : 'Disabled',
          transitions: rule.transitions?.map(transition => ({
            storageClass: transition.storageClass.value,
            transitionInDays: transition.transitionAfter?.toDays()
          })),
          expirationInDays: rule.expiration?.toDays(),
          abortIncompleteMultipartUpload: rule.abortIncompleteMultipartUploadAfter ? {
            daysAfterInitiation: rule.abortIncompleteMultipartUploadAfter.toDays()
          } : undefined
        }))
      };

      console.log(`✅ Règles de cycle de vie appliquées au bucket: ${bucketName}`);
      console.log(`   • Passage en Intelligent Tiering à J0`);
      console.log(`   • Suppression des emails à J90`);
      console.log(`   • Nettoyage des uploads incomplets à J1`);
    }

    if (s3Buckets.length === 0) {
      console.warn('⚠️  Aucun bucket S3 trouvé dans la bibliothèque ses-email-forwarding');
    }
  }
}