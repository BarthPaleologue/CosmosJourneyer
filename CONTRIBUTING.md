# Contributing to Cosmos Journeyer

Cosmos Journeyer is an open source project and contributions are welcome! There is too much to do for one person alone. If you want to contribute, please read the following guidelines first.

## Reporting bugs

Finding bugs and reporting them is key to make the project better. If you find a bug, please open an issue on the [issue tracker](https://github.com/BarthPaleologue/CosmosJourneyer/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=)

## Suggesting features

If you have an idea for a new feature, please open an issue on the [issue tracker](https://github.com/BarthPaleologue/CosmosJourneyer/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=)

## Pull requests

There is still plenty to do on Cosmos Journeyer. You can check the [issue tracker](https://github.com/BarthPaleologue/CosmosJourneyer/issues) for ideas on what to work on. If you have an idea that is not in the issue tracker, please create a new issue so that we can talk about it!

To contibute follow these steps:

1. Get familiar with the project by reading the [architecture document](ARCHITECTURE.md)
2. Fork the repository
3. Create a new branch from the `main` branch:
    ```sh
    git checkout -b [name_of_your_new_branch]
    ```
4. Test your changes (`pnpm test:unit` and [end-to-end tests](/packages/game/tests/e2e/Readme.md))
5. Commit & push your changes
6. Open a pull request to the `main` branch

You can open a draft pull request if you want to get feedback on your changes before they are ready to be merged.

Please use **rebase** to keep your branch in sync with main.

Pull request are tested against the linter and the unit tests, make sure you run them before opening a pull request.

Code that does not pass the linter or the unit tests will not be merged, but I will help you fix it don't worry.

## Translation

Cosmos Journeyer is available in multiple languages, but you can add more or improve existing translations.

### Modifying existing language

To make a change in an existing language, go to `packages/game/src/locales` and find the language you want to modify by its code.
For example if you want to modify the American English translation, you will find the `en-us` folder.
Inside this folder are many JSON files containing the various words and sentences used throughout the project.

Make the changes you want by editing the files and then open a pull request. If you don't have/don't want to create a GitHub account, you can email the files at
[barth.paleologue@cosmosjourneyer.com](mailto:barth.paleologue@cosmosjourneyer.com). In any case you will be credited for your work.

### Adding a new language

Adding a new language altogether is quite straightforward as well. Simply go to the `packages/game/src/locales` folder and create a new folder with the language code you want to create.
Then, paste inside the content of another language directory and translate the content inside the JSON files.

You don't need to code at all, the language will be automatically bundled and available inside Cosmos Journeyer.

To test your changes, simply run the project using `npm run serve` and change the url in this format:

```
http://localhost:8080/?lang=fr-FR
```

You only need to replace `fr-FR` with the language code you want to test.
