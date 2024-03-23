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
