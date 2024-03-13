import i18next from 'i18next';

import enCommon from '../locales/en-us/common.json';
import enMainMenu from '../locales/en-us/mainMenu.json';
import enPauseMenu from '../locales/en-us/pauseMenu.json';
import enNotifications from '../locales/en-us/notifications.json';

import frCommon from '../locales/fr-fr/common.json';
import frMainMenu from '../locales/fr-fr/mainMenu.json';
import frPauseMenu from '../locales/fr-fr/pauseMenu.json';
import frNotifications from '../locales/fr-fr/notifications.json';

await i18next.init({
    lng: navigator.language, // if you're using a language detector, do not define the lng option
    debug: true,
    fallbackLng: 'en-US',
    resources: {
        "en-US": {
            common: enCommon,
            mainMenu: enMainMenu,
            pauseMenu: enPauseMenu,
            notifications: enNotifications
        },
        "fr-FR": {
            common: frCommon,
            mainMenu: frMainMenu,
            pauseMenu: frPauseMenu,
            notifications: frNotifications
        }
    }
});

export default i18next;