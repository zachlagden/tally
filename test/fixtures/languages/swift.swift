// Thermometer

class Thermometer {
    var reading = 0

    func warmer() -> Bool {
        if reading > 20 {
            return true
        }
        return false
    }
}
