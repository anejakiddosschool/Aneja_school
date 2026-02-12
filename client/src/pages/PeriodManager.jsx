


import React from "react";

const PeriodManager = ({ periods, setPeriods }) => {
  const addPeriod = () => {
    const lastEnd =
      periods.length > 0 ? periods[periods.length - 1].end : "09:00";

    const newPeriod = {
      id: Date.now(),
      start: lastEnd,
      end: lastEnd,
    };

    setPeriods([...periods, newPeriod]);
  };

  const removePeriod = () => {
    if (periods.length <= 1) return;
    setPeriods(periods.slice(0, -1));
  };

  const updateTime = (index, field, value) => {
    const updated = [...periods];
    updated[index][field] = value;
    setPeriods(updated);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-3xl shadow-xl mb-8">
      
      <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
        ⏰ Manage Class Periods
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {periods.map((period, index) => (
          <div
            key={period.id}
            className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition"
          >
            <div className="font-bold text-indigo-600 text-lg">
              P{index + 1}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="time"
                value={period.start}
                onChange={(e) =>
                  updateTime(index, "start", e.target.value)
                }
                className="border rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-400 outline-none"
              />

              <span className="font-semibold text-gray-600">-</span>

              <input
                type="time"
                value={period.end}
                onChange={(e) =>
                  updateTime(index, "end", e.target.value)
                }
                className="border rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={addPeriod}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl shadow-md transition"
        >
          ➕ Add Period
        </button>

        <button
          onClick={removePeriod}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl shadow-md transition"
        >
          ➖ Remove Period
        </button>
      </div>
    </div>
  );
};

export default PeriodManager;
