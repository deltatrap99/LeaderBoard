import { fetchLeaderboardData } from './src/data/liveData';

async function main() {
  try {
    const data = await fetchLeaderboardData();
    console.log("Semester Categories:");
    data.semester.forEach(cat => {
      console.log(`- ${cat.categoryName} (${cat.topRankers.length + cat.otherRankers.length} ambassadors)`);
    });
    console.log("Month Categories:");
    data.month.forEach(cat => {
      console.log(`- ${cat.categoryName} (${cat.topRankers.length + cat.otherRankers.length} ambassadors)`);
    });
    console.log("Quarter Categories:");
    data.quarter.forEach(cat => {
      console.log(`- ${cat.categoryName} (${cat.topRankers.length + cat.otherRankers.length} ambassadors)`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
