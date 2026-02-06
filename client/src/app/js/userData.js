import { SERVER_URL } from "./config";
export async function getCategories(user_id) {
  try {
    const res = await fetch(`${SERVER_URL}/categories/${user_id}`, {
      method: "POST",
      credentials: "include",
    });

    if (res.status === 401) {
      return [{ id: "default-work", name: "Work", color: "#ffac58" }];
    }

    if (!res.ok) {
      console.error("getCategories failed:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : []; // ✅ always array
  } catch (error) {
    console.error(error.message);
    return [];
  }
}


export async function getTasks(user_id) {
  try {
    const res = await fetch(`${SERVER_URL}/tasks/${user_id}`, {
      method: "POST",
      credentials: "include",
    });

    if (res.status === 401) {
      return [{      
      id: "1",
      title: "Morning Meditation",
      description: "Meditate for 10 minutes to start the day mindfully",
      difficulty: "easy",
      importance: "high",
      category: "health",
      scheduleType: "daily",
      dueTime: "07:00",
      recurrence: { pattern: "daily" },
      reminder: { enabled: true, beforeMinutes: 15 },
      completed: false,
      completedDates: [],}];
    }

    if (!res.ok) {
      console.error("getCategories failed:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : []; // ✅ always array
  } catch (error) {
    console.error(error.message);
    return [];
  }
}
