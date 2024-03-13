import i18next from 'i18next';

import enCommon from '../locales/en-us/common.json';
import enMainMenu from '../locales/en-us/mainMenu.json';

import frCommon from '../locales/fr-fr/common.json';
import frMainMenu from '../locales/fr-fr/mainMenu.json';

await i18next.init({
    lng: navigator.language, // if you're using a language detector, do not define the lng option
    debug: true,
    fallbackLng: 'en-US',
    resources: {
        "en-US": {
            common: enCommon,
            mainMenu: enMainMenu
        },
        "fr-FR": {
            common: frCommon,
            mainMenu: frMainMenu
        }
    }
});

export default i18next;