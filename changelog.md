## [x.y.z] - 2024-03-15

### Added

- example of new feature
- fix of a bug

### Changed

- case of a change in a feature
- refactor of some code

### Removed

- feature that is no longer supported
- unused code

---

## [1.2.0] - 2024-03-15

### Added

- `/subscriptions` command : List all the subscriptions of the user.
- `/unsubscribe` command : Add arguments to unsubcribe only on a city specified (before was all subscriptions).
- Add comments and documentation on code
- Add custom messages for ramadan and eid on the bot.
- Add eslint and prettier to the project. Ran the linter and formatter on the code.

### Changed

- `/subscribe` command : Improve command, add checks to avoid duplicate subscriptions.
- `/prayer` : Replaced the Imsak time by the Sunrise time in the prayer message.

---

## [1.2.1] - 2024-03-16

### Added

- Add eslintrc rules and fix all the errors.
- refactor the code according to eslint result to be more readable and maintainable.

### Changed

- `/hadith` command : Make second arg optionnal, create guild if not exists.

---

## [1.2.2] - 2024-03-24

### Added

- enforce commit message.
- enforce squash commits on MRs.
- enable sast.
- store automated version in db then inform users when a new release.
- add `/release_notes` command to enable or disable release notes notifications.

---

## [1.2.3] - 2024-03-24

### Added

- Errors checks on users not reachable on release notes notifications.
  (Sorry brothers for the spam in previous release 😅, It will be okay now)

---

## [1.2.4] - 2024-05-01

### Changed

- Fixed the bug related to API Rate Limiting. Some users were not receiving the notifications due to the rate limiting of the API.
- SonarQube bugs and code smells fixed.

---

## [1.2.5] - 2024-05-20

### Changed

- Made prayer messages better
- Improve errors logs and optimized code on hadiths scheduled notifications
- Updated discordjs package to latest version
- SonarQube Reliability, Maintenability and Security Hotspots and code smells fixed.

---

## [1.2.6] - 2024-05-26

### Added

- Can now run `/quizz` command in DM

### Changed

- Fixed `/subscriptions` and `/quizz` command
- Make sure we can't use `/quran`, `/hadith` commands in a DM
- Updated node to 22 version
- Fixed some SonarQube Reliability, Maintenability and Security Hotspots and code smells

---

## [1.2.7] - 2024-10-12

Hello brothers and sisters, I am happy to announce a new feature on MuslimBot. 🙂
I hope you will enjoy it, it comes from a suggestions made on the github project. If you'd like to participate in future discussions, head over to my [Github](https://github.com/fivekage/muslimbot/discussions) page and contribute your ideas!
Don't forget to pray for Palestine 🇵🇸 and Lebanon 🇱🇧, especially during these difficult times. May Allah grant them peace and relief. 🙏

### Added

- /events command to get current islamic date, events of the day and upcoming events within the next 3 months, try it out!

## Changed

- Upgraded/Updated all packages to latest version

---

## [1.2.9] - 2024-11-20

Hello brothers and sisters, I am happy to announce a new release on MuslimBot. 🙂
I am sorry about the recent problems with the bot, I am working on it to fix them.

**If you lose your subscriptions, use `/subscriptions` command to get the list of your subscriptions.**

**If you find them disabled, use `/subscribe <city> <country>` command to get back your subscriptions.`**

If you'd like to contributing to the project, head over to my [Github](https://github.com/fivekage/muslimbot/discussions) page and contribute your ideas!

### Added

- Track command activities in the database to create statistics about the usage of the commands.

## Changed

- Upgraded/Updated all packages to latest version
- Create database migrations files
- Fix subscriptions auto-disabling bug..
- Improve pipelines and GitOps
- Refactor/Optimize code

---

## [1.2.11] - 2024-12-20

Hello brothers and sisters, I am happy to announce a new release on MuslimBot. 🙂

If you like to contributing to the project, head over to my [Github](https://github.com/fivekage/muslimbot/discussions) page and contribute your ideas!

### Added

- Deploy Release Job on Github
- Add link to release notes in the changelog sent on discord
- Create 2 templates (feature,bug) for github issues
- Autocomplete for commands: `/prayer`, `/subscribe` and `/unsubscribe` . It will help the user to find the city and country they want to subscribe to.
- Create a donation link and embed it in few messages
- Fix commands_statistics sql view
- Fix `/events` command
- Change image registry from dockerhub to github

## Changed

- Move Docker Image to Github Container Registry

  ***

---

## [1.2.12] - 2025-03-18

### Added

- Migrate app to be used in a kubernetes cluster
- Create probes to check if the app is running and ready

## Changed

- Rework CI/CD pipeline

---

## [1.2.13] - 2025-07-27

### Added

- Change Source API data for Hadiths
- Renamed `/hadith` command to `/daily-hadith` -> it will now send a random hadith every day in the server.
- Add `/hadith` command to get a hadith from a specific book.
- Fix some minor bugs in the code.
- Add an option to `/subscriptions` command to show only enabled subscriptions.

## Changed

- Rework all hadiths code to be more readable and maintainable.
- Update dependencies to latest versions.
- Fixed `/subscribe` command (it was not working properly).

---

## [1.3.0] - 2026-02-03

### Changed

- Rework all ux/ui of the bot messages to be more user friendly and attractive.
- Add more details in the messages
- Update all dependencies

---

## [1.3.1] - 2026-02-03

### Changed

- Track users who have blocked the bot in DM and avoid sending them messages that will fail.
- Fix github workflow to avoid running release job
- Optimize code related to prayer notifications sendings. It will now send the notifications in batch every 5 minutes to avoid hitting the rate limit of the API.
- Rework ui/ux of the prayer notifications messages to be more attractive and informative.
- Update node to 24 lts version

---

## [1.3.2] - 2026-03-03

### Changed

- Fix notifications sending, sorry for the inconvenience 🙏.

---

## [1.3.3] - 2026-03-03

### Changed

- Change again the notifications prayer ux/ui.
- Add a random message in each prayer notification to make it more attractive and less repetitive.
- Optimize code to avoid api rate limits.
- Hide changelog details in the notifications messages and add a link to the full changelog in the release notes.
