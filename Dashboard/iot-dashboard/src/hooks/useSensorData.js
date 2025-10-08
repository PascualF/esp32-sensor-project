import { useState, useEffect } from "react";
import { database } from "../firebase/firebase";
import { ref, onValue } from 'firebase/database';

export default function useSensorData(){
    const [readingsTempHum, setReadingsTempHum] = useState([]);
    const [readingsVibrations, setReadingVibrations] = useState([])

    useEffect(() => {
        const readingsOfTempHum = ref(database, "device/device01/averages");
        const readingsOfVibrations = ref(database, "device/device01/vibration_events")
        
        const unsubscribeTempHum = onValue(readingsOfTempHum, (snapshot) => {
            const data = snapshot.val();
            if(data) setReadingsTempHum(Object.values(data));
        });

        const unsubscribeVibration = onValue(readingsOfVibrations, (snapshot) => {
            const data = snapshot.val();
            if(data) setReadingVibrations(Object.values(data));
        });

        return () => {
            unsubscribeTempHum();
            unsubscribeVibration();
        }
    }, [])

    return {readingsTempHum, readingsVibrations};
}