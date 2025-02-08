import { formatDateTimeJJMMAAHHMM, formatDuration, formatDateTimeUTC2Digits } from '../utils/dateUtils';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Importer les icônes

// Fonction pour vérifier la cohérence des dates des étapes
export const checkDateConsistency = (roadtrip) => {
  let alertCount = 0;
  const errorMessages: { message: string, stepId: string, stepType: string }[] = [];

  // Fusionner stages et stops en une seule liste steps et trier par arrivalDateTime croissant
  const steps = [
    ...roadtrip.stages.map(stage => ({ ...stage, type: 'stage', id: stage._id })),
    ...roadtrip.stops.map(stop => ({ ...stop, type: 'stop', id: stop._id }))
  ].sort((a, b) => new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime());
  // Règles globales pour le Roadtrip
  if (new Date(roadtrip.startDateTime) >= new Date(roadtrip.endDateTime)) {
    alertCount++;
    errorMessages.push({ message: 'Roadtrip : Date de début < Date de fin.', stepId: '', stepType: '' });
  }

  steps.forEach((step) => {
    // Règles pour les Stages
    if (step.type === 'stage') {
      if (new Date(step.arrivalDateTime) > new Date(step.departureDateTime)) {
        alertCount++;
        errorMessages.push({ message: `${step.name}\n - Date d'arrivée > Date de départ`, stepId: step.id, stepType: step.type });
      }

      step.accommodations?.forEach((accommodation) => {
        if (new Date(accommodation.arrivalDateTime) > new Date(accommodation.departureDateTime)) {
          alertCount++;
          errorMessages.push({ message: `Date d'arrivée > Date de départ :\n  - ${accommodation.name} dans l'étape ${step.name}`, stepId: step.id, stepType: step.type });
        }
        if (new Date(accommodation.arrivalDateTime) < new Date(step.arrivalDateTime) ||
          new Date(accommodation.departureDateTime) > new Date(step.departureDateTime)) {
          alertCount++;
          errorMessages.push({ message: `Hors des dates de l'étape :\n  - ${accommodation.name}`, stepId: step.id, stepType: step.type });
        }
      });

      step.activities?.forEach((activity) => {
        if (new Date(activity.startDateTime) > new Date(activity.endDateTime)) {
          alertCount++;
          errorMessages.push({ message: `Date de début > Date de fin :\n  - ${activity.name} dans l'étape ${step.name}`, stepId: step.id, stepType: step.type });
        }
        if (new Date(activity.startDateTime) < new Date(step.arrivalDateTime) ||
          new Date(activity.endDateTime) > new Date(step.departureDateTime)) {
          alertCount++;
          errorMessages.push({ message: `Hors des dates de l'étape :\n  - ${activity.name}`, stepId: step.id, stepType: step.type });
        }
      });
    }

    // Règles pour les Stops
    if (step.type === 'stop') {
      if (new Date(step.arrivalDateTime) > new Date(step.departureDateTime)) {
        alertCount++;
        errorMessages.push({ message: `Incohérence de date pour le stop ${step.name}: arrivalDateTime > departureDateTime`, stepId: step.id, stepType: step.type });
      }
    }

    // Inclusion temporelle dans le Roadtrip
    if (new Date(step.arrivalDateTime) < new Date(roadtrip.startDateTime) ||
      new Date(step.departureDateTime) > new Date(roadtrip.endDateTime)) {
      alertCount++;
      errorMessages.push({ message: `Hors des dates du roadtrip :\n  - ${step.name}`, stepId: step.id, stepType: step.type });
    }
  });

  // Règles de chronologie globale
  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    if (new Date(currentStep.departureDateTime) > new Date(nextStep.arrivalDateTime)) {
      alertCount++;
      errorMessages.push({
        message: `Chevauchement de dates :\n  - ${currentStep.name} - Départ : ${formatDateTimeUTC2Digits(currentStep.departureDateTime)}\n  - ${nextStep.name} - Arrivée : ${formatDateTimeUTC2Digits(nextStep.arrivalDateTime)}`,
        stepId: currentStep.id,
        stepType: currentStep.type
      });

    }
  }


  // Vérification de la cohérence de la date d'arrivée avec le temps de trajet estimé
  for (let i = 1; i < steps.length; i++) {
    const previousStep = steps[i - 1];
    const currentStep = steps[i];

    const estimatedArrivalTime = new Date(previousStep.departureDateTime).getTime() + (currentStep.travelTime * 60 * 1000);
    if (new Date(currentStep.arrivalDateTime).getTime() < estimatedArrivalTime) {
      alertCount++;
      errorMessages.push({
        message: `Incohérence de la date d'arrivée :\n  - ${currentStep.name} - Arrivée : ${formatDateTimeUTC2Digits(currentStep.arrivalDateTime)}\n  - Temps de trajet estimé : ${formatDuration(currentStep.travelTime)}\n  - Step précédent : ${previousStep.name} - Départ : ${formatDateTimeUTC2Digits(previousStep.departureDateTime)}`,
        stepId: currentStep.id,
        stepType: currentStep.type
      });
    }
  }

  console.log('Messages d\'erreur:', errorMessages);
  return { alerts: alertCount, errorMessages };
};