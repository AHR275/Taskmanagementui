import dailyStreak  from "./daily-streak.cron.js";
import tasksReminder from "./tasks-reminder.cron.js";


async function main() {
    await dailyStreak();
    await tasksReminder();
    console.log("runned >>>>>>.")
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});