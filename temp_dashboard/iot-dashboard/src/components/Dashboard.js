import useSensorData from "../hooks/useSensorData";
import Chart from "./Chart";
import SensorCard from "./SensorCard";

export default function Dashboard(){
    const {readingsTempHum, readingsVibrations} = useSensorData();
    const latestReadingTempHum = readingsTempHum[readingsTempHum.length - 1] || {};
    const latestReadingVibration = readingsVibrations[readingsVibrations.length - 1] || {};

    const sensors = [ 
        {label: "Temperature", value: latestReadingTempHum.avgTemp, unit: "°C", color:"#1b93b1ff", dataKey: "avgTemp"},
        {label: "Humidity", value: latestReadingTempHum.avgHum, unit: "%", color:"#41a334ff", dataKey: "avgHum"}
    ]

    return (
        <div className="flex flex-col min-h-screen w-full p-4 lg:p-6 bg-gray-600">
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold pl-3 mb-6 text-center md:text-left">
                IoT Maintenance Dashboard
            </h1>

            {/* Sensor Cards: stack on mobile, side by side on larger screen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4 mb-6">
                {sensors.map(sensor => (
                    <SensorCard 
                        key={sensor.label}
                        label={sensor.label} 
                        value={Math.round(sensor.value) || 0} 
                        unit={sensor.unit}
                        className="w-full sm:w-1/2 lg:w-1/3 h-32 sm:h-40 lg:h-48"
                    />
                ))}
            </div>

            {/* Charts: full width on small, side by side on large */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                { sensors.map(sensor => (
                    <Chart 
                        key={sensor.label}
                        data={readingsTempHum} 
                        dataKey={sensor.dataKey} 
                        title={sensor.label} 
                        color={sensor.color}
                    />
                ))}
            </div>
           
            {/* Vibration signal */}
            <div className="mt-8 w-full bg-white p-4 rounded-lg shadow h-40 flex flex-col items-center justify-center">
                <p className="text-gray-500 font-bold">Vibration Alerts</p>
                {latestReadingVibration.level}
                    <div className="flex">
                    {readingsVibrations.lenght === 0 ? (
                        <p>No recent vibrations</p>
                    ) : (
                        readingsVibrations
                            .slice(-5) // show last 10 events
                            .reverse() // latest on top
                            .map((event, index) => (
                                <div
                                    key={index}
                                    className={
                                        `flex flex-col justify-between items-center p-2 mb-1 rounded ${
                                            event.level === "ORANGE"
                                            ? "bg-orange-300"
                                            : event.level === "RED"
                                            ? "bg-red-200"
                                            : "bg-green-200"
                                        }`}
                                >
                                    <span>{event.level}</span>
                                    <span>{event.magnitude.toFixed(2)}</span>
                                    <span>{new Date(event.timestamp * 1000).toLocaleString("pt-PT")}</span>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* <div className="mt-6 flex justify-center">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => console.log(readingsTempHum)}
                >
                    Press me for data console log
                </button>
            </div> */}
        </div>
    )
}