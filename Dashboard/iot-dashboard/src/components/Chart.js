import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Chart({ data, dataKey, title, color }) {

    return (
        <div className='w-full h-64 sm:h-80 lg:h-96 p-2 bg-white rounded-lg shadow'>
            <h3 className='text-lg font-bold mb-2'>{title}</h3>
            <ResponsiveContainer width="100%" height="100%" >
                <LineChart data={data}>
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleDateString()}
                    />
                    <YAxis/>
                    <Tooltip labelFormatter={(t) => new Date(t* 1000).toLocaleTimeString()}/>
                    <Legend />
                    <Line type="monotone" dataKey={dataKey} stroke={color} dot={false}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}