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

## [1.2.10] - 2024-12-18

Hello brothers and sisters, I am happy to announce a new release on MuslimBot. 🙂

If you like to contributing to the project, head over to my [Github](https://github.com/fivekage/muslimbot/discussions) page and contribute your ideas! 

### Added
- Deploy Release Job on Github
- Add link to release notes in the changelog sent on discord
- Create 2 templates (feature,bug) for github issues
- Autocomplete for commands: `/prayer`, `/subscribe` and `/unsubscribe` . It will help the user to find the city and country they want to subscribe to.

## Changed
- Move Docker Image to Github Container Registry
  

  
