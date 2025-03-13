# Saves in Cosmos Journeyer

Picture this: you've played a game for tens of hours and you just updated your game to the latest version. You are excited to play again but upon starting your latest save you are greeted with an error message about your save being corrupted.

Did it ever happen to you? Because it happened to me once or twice and it was very frustrating.

I do not want this experience for any player of Cosmos Journeyer, but at the same time the game is going to evolve over the years thanks to its open source nature.

How do we reconcile these two facts?

## Versioning

When changes involve more than adding a new property to the save file (like restructuring the save file or renaming some fields), we will create a new save file schema version.

This means creating a new folder using the pattern `vX` where `X` is the version number. Inside the folder goes the new schema and tests to verify that we can indeed use this schema to load our data. Also the `SaveSchema` variable from `SaveFileData` must be assigned the new schema.

Okay, but what about saves from older versions?

## Auto-migrations

Aside the new schema and tests, it is expected to also create a function `migrateVYToVX` where `Y` is the previous version and `X` is the new version.

This function takes as argument the data from the older schema and migrates it to the new schema.

By ensuring that each version has its own migration function, we can recursively migrate any save file to the latest version!

This way, we can ensure no save files will ever be left behind and players can enjoy the latest version of the game without any issues with their old saves.
