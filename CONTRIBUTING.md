# Contributing to Cosmos Journeyer

Cosmos Journeyer is an open source project and contributions are welcome! There is too much to do for one person alone. If you want to contribute, please read the following guidelines first.

## How to contribute

### Reporting bugs

Finding bugs and reporting them is key to make the project better. If you find a bug, please open an issue on the [issue tracker](https://github.com/BarthPaleologue/CosmosJourneyer/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=)

### Suggesting features

If you have an idea for a new feature, please open an issue on the [issue tracker](https://github.com/BarthPaleologue/CosmosJourneyer/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=)

### Pull requests

Pull requests are welcome! If you want to contribute code, please follow these steps:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit your changes
5. Push your changes
6. Open a pull request

You can open a draft pull request if you want to get feedback on your changes before they are ready to be merged.

Pull request are tested against the linter and the unit tests, make sure you run them before opening a pull request.

Code that does not pass the linter or the unit tests will not be merged.

## Translation

Cosmos Journeyer is available in multiple languages, but you can add more or improve existing translations.

### Modifying existing language

To make a change in an existing language, go to `src/locales` and find the language you want to modify by its code. 
For example if you want to modify the American English translation, you will find the `en-us` folder. 
Inside this folder are many JSON files containing the various words and sentences used throughout the project.

Make the changes you want by editing the files and then open a pull request. If you don't have/don't want to create a GitHub account, you can email the files at 
[barth.paleologue@cosmosjourneyer.com](mailto:barth.paleologue@cosmosjourneyer.com). In any case you will be credited for your work.

### Adding a new language

Adding a new language altogether is quite straightforward as well. Simply go to the `src/locales` folder and create a new folder with the language code you want to create.
Then, paste inside the content of another language directory and translate the content inside the JSON files.

You don't need to code at all, the language will be automatically bundled and available inside Cosmos Journeyer.

To test your changes, simply run the project using `npm run serve` and change the url in this format:

```
http://localhost:8080/?lang=fr-FR
```

You only need to replace `fr-FR` with the language code you want to test.

## Contribution ideas

There is still plenty to do on Cosmos Journeyer. Here are some ideas of contributions you can make (with stars indicating the difficulty of the task):

### Visuals

- Improve the visuals of Neutron Stars to make the cone of the matter jets less visible (⭐⭐)
- Improve the visuals of Gas Giants to make them look better from closer (⭐⭐)
- Improve the visuals of the ocean using a separate mesh and FFT for wave generation (⭐⭐⭐)
- Experiment with volumetric clouds (⭐⭐⭐)

### On-foot exploration

- Add new character animations (using Mixamo for example) (⭐)
- Make the character animation system more scalable (⭐⭐⭐)
- Add conditions to asset scattering to avoid grass in desert and at the bottom of the ocean (⭐⭐)

### Space gameplay

- Add a cockpit view for spaceships (⭐⭐⭐)
- Add new spaceships and space stations (⭐⭐⭐)
- Add lasers to spaceships (⭐⭐)
- Add trade missions at space stations (⭐⭐⭐)

### Optimization

- Optimize the volumetric atmosphere rendering (⭐⭐⭐)
- Optimize the lens flare rendering (⭐⭐)

### Miscellaneous

- Improve WebGPU support (⭐⭐⭐)
- Improve the documentation (⭐)
