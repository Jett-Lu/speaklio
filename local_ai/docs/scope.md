# Speaklio Parser Scope

The local parser turns short spoken app text into JSON actions only.

It should not write normal replies, mutate the database, or make up missing numbers.

## Recognized Action Scope

- Profile details.
- Weight goals.
- Weight logs.
- Workout logs.
- Food logs.
- Calorie logs.
- Macro update requests.
- Simple tip requests based on app logs.
- Dashboard questions.
- Unknown or unsupported commands.

## Currently Mapped To Metric Entries

The backend preview mapper currently turns these actions into proposed `metric_entries` payloads:

- `set_weight_goal`
- `log_weight`
- `log_workout`
- `log_calories`
- `log_food`

These actions are recognized by the parser schema but are not saved as metric entries yet:

- `set_profile`
- `request_macro_update`
- `request_tip`
- `ask_dashboard_question`
- `unknown`

Unsupported actions should return a preview item with `entry: null` and a reason.

## Parser Rules

- Do not make up missing numbers.
- Do not estimate calories unless the user gave the number.
- Do not give medical advice.
- If the command is unclear or outside the app, return `unknown`.
