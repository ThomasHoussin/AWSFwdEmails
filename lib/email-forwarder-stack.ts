import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailForwardingRuleSet } from '@seeebiii/ses-email-forwarding';

interface EmailForwarderStackProps extends cdk.StackProps {
  config: any;
}

export class EmailForwarderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EmailForwarderStackProps) {
    super(scope, id, props);

    const config = props.config;

    // Validation de la configuration
    this.validateConfig(config);

    // Création du système de transfert d'emails avec SES
    new EmailForwardingRuleSet(this, 'EmailForwardingRuleSet', {
      // Active automatiquement le rule set (un seul peut être actif)
      enableRuleSet: true,

      // Configuration du transfert d'emails
      emailForwardingProps: [{
        // Nom de domaine pour recevoir/envoyer les emails
        domainName: config.domainName,

        // Vérification automatique du domaine dans SES (nécessite Route53)
        verifyDomain: config.verifyDomain,

        // Vérification des adresses email de destination (si pas de domaine vérifié)
        verifyTargetEmailAddresses: config.verifyTargetEmailAddresses,

        // Préfixe pour l'adresse d'expédition (ex: noreply@domaine.fr)
        fromPrefix: config.fromPrefix,

        // Mappings des adresses email
        emailMappings: config.emailMappings
      }]
    });

    // Outputs utiles
    new cdk.CfnOutput(this, 'DomainName', {
      value: config.domainName,
      description: 'Domaine configuré pour le transfert d\'emails'
    });

    new cdk.CfnOutput(this, 'EmailMappings', {
      value: JSON.stringify(config.emailMappings, null, 2),
      description: 'Mappings d\'emails configurés'
    });
  }

  private validateConfig(config: any): void {
    const requiredFields = ['domainName', 'fromPrefix', 'emailMappings'];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Champ obligatoire manquant dans la configuration: ${field}`);
      }
    }

    if (!Array.isArray(config.emailMappings) || config.emailMappings.length === 0) {
      throw new Error('Au moins un mapping d\'email doit être configuré');
    }

    for (const mapping of config.emailMappings) {
      if (!mapping.receivePrefix || !mapping.targetEmails || !Array.isArray(mapping.targetEmails)) {
        throw new Error('Chaque mapping doit avoir un receivePrefix et un tableau targetEmails');
      }
    }
  }
}