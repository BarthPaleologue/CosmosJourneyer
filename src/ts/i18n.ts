import i18next from 'i18next';
import enCommon from '../locales/en-us/common.json';
import frCommon from '../locales/fr-fr/common.json';

await i18next.init({
    lng: navigator.language, // if you're using a language detector, do not define the lng option
    debug: true,
    fallbackLng: 'en-US',
    resources: {
        "en-US": {
            common: enCommon
        },
        "fr-FR": {
            common: frCommon
        }
    }
});

export default i18next;