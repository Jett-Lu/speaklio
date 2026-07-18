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
- Expense logs.
- Sleep logs.
- Hydration logs.
- Mindfulness logs.
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
- `log_expense`
- `log_sleep`
- `log_hydration`
- `log_mindfulness`

These actions are recognized by the parser schema but are not saved as metric entries yet:

- `set_profile`
- `request_macro_update`
- `request_tip`
- `ask_dashboard_question`
- `update_last_entry`
- `delete_last_entry`
- `unknown`

Unsupported actions should return a preview item with `entry: null` and a reason.

## Parser Rules

- Do not make up arbitrary numbers for non-nutrition actions.
- For food logs, estimate reasonable calories, protein, carbs, fats, and fiber from common nutrition knowledge when the user gives a recognizable food but omits nutrition numbers.
- Treat natural phrasing such as "I have a chocolate chip cookie today", "I had ice cream", or "I'm having eggs for breakfast" as `log_food`.
- If the user omits serving size, assume a common single serving and keep the `quantity` field descriptive, such as "estimated single serving".
- Preserve provided `calories`, `protein`, `carbs`, `fats`, and `fiber` values for food logs when the user gives them.
- Set `nutrition_estimated` to true when any nutrition number is inferred instead of user-provided.
- Set `nutrition_estimated` to false when the user provided all nutrition numbers being logged.
- Treat "how many calories" or similar nutrition questions as `ask_dashboard_question` unless the user also gives a calorie number and asks to log it.
- Treat corrections such as "actually it was 300 calories", "change that to dinner", or "make the last one 20g protein" as `update_last_entry`.
- Treat "delete that", "remove the last log", and "undo that entry" as `delete_last_entry`.
- For expenses, use the provided amount and a simple category such as Dining, Groceries, Transport, Bills, or Other.
- For sleep, convert hours to `sleep_minutes` when the user gives hours.
- For hydration, preserve the user's unit when it is ml, l, or oz.
- For mindfulness, use the stated minutes and optional session title if present.
- Do not give medical advice.
- If the command is unclear or outside the app, return `unknown`.
