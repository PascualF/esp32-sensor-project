export default function SensorCard({ label, value, unit, date, className }){

    const getAlertMessage = (label, value) => {

        const thresholds = {
            Temperature: {low:18, high:26, lowMsg: "Too cold", highMsg:" Too hot"},
            Humidity: {low:40, high:60, lowMsg: "Too dry", highMsg:" Too humid"},
        }
        
        if (!thresholds[label]) return null

        console.log(label)
        console.log(value)

        if(value >= thresholds[label].high) return thresholds[label].highMsg
        if(value <= thresholds[label].low) return thresholds[label].lowMsg

        return null
    }

    const alertClass = getAlertMessage(label, value) ? "bg-red-400": "bg-white"

    return (
        <div className={`flex flex-col justify-between border rounded-lg p-4 m-2 shadow-lg w-40 text-center ${className} ${alertClass}`}>
            <div>
                <h3 className="text-lg font-bold">{label}</h3>
                <p className="text-2xl">{value} {unit}</p>
                {getAlertMessage(label, value)} 
            </div>
            <p>{`Last date info: ${(new Date(date * 1000)).toLocaleDateString()}`}</p>
        </div>
    )
}