'use-strict';

const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July',
'August', 'September', 'October','November','December']

class Workout{
    constructor(coord, distance, duration){
        this.date = new Date()
        this.id = Date.now() + ''.slice(-10)
        this.coord = coord
        this.distance = distance
        this.duration = duration
    }

    _setDescription(){
        const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October','November','December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Cycling extends Workout{
    type = "cycling";
    constructor(coord,distance, duration, cadence){
        super(coord,distance,duration,cadence)
        this.cadence = cadence
        this.calSpeed();
        this._setDescription()
    }
    calSpeed() {
        this.speed = (this.distance / (this.duration / 60));
    }
}

class Running extends Workout{
    type = "running"
    constructor(coord, distance, duration, elevationGain){
        super(coord, distance,duration)
        this.elevationGain = elevationGain
        this.calPace();
        this._setDescription()
    }
    calPace(){
        this.pace = (this.duration / this.distance)
        return this.pace;
    }
}




const form = document.querySelector('.form');
const containerWorkout = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence')
const elevation = document.querySelector('.form__input--elevation');



class App{

    #map;
    #newCoords;
    #workout = []

    constructor(){
        this._getPosition()
        form.addEventListener("submit",this._newWorkout.bind(this));
        inputType.addEventListener('change', function() {
            elevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        })
        
        document.querySelector('.workouts').addEventListener("click", this._moveToPopup.bind(this));
    }

    _getPosition(){
        // if browser support geo location then this if block  is execute
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                alert("Could n't get your location")
            })
        }
    }

    _loadMap(position){
        const {latitude,longitude} = position.coords;
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click",this._showForm.bind(this));
    }

    _showForm(c){
        this.#newCoords = c;
        form.classList.remove('hidden');
        inputDistance.focus()
    }
    _toggleElevationField(){

    }
    _newWorkout(event){
        
        const isValid = (...input) => {
            return input.every(inp => Number.isFinite(inp))
        }
        const isPositive = (...input) => {
            return input.every(inp => 
                inp >= 0)
        }

        event.preventDefault();  

        let val = inputType[0].value;
        const {lat,lng} = this.#newCoords.latlng;
        const coords = [lat,lng];

        // get data from form 
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;

        // if type == running, then create running class object
        if (type === 'running'){
            let cadence = +inputCadence.value;
            if (
                !isValid(distance,duration,cadence) ||
                !isPositive(distance,duration,cadence)){
                return alert("Input have to be positive number");
            }
            workout = new Running( [lat,lng],distance,duration,cadence)
            this.#workout.push(workout);
        }

        // if type  = cycling
        if (type === 'cycling'){
            let inputElevation = +elevation.value;  
            if (
                !isValid(distance,duration,inputElevation) || 
                !isPositive(distance,duration,inputElevation)){
                return alert("Input have to be positive number");
            }
            workout= new Cycling([lat,lng],distance,duration,inputElevation);
            this.#workout.push(workout);
        }

        // render workout market
        this._renderWorkoutMarker(workout);

        // render workout 
        this._renderWorkout(workout);
        
        // hide form after rendering workout
        this._hideform()

        // store data in local storage of browser
        this._setLocalStorage()

        this._getStorageData()
    }

    _hideform(){
        inputDistance.value = inputDuration.value = inputCadence.value = '';
        form.style.display="none";
        form.classList.add("hidden");
        setTimeout( () => {
            form.style.display = "grid";
        },1000);
    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coord)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClone: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        .setPopupContent(`${workout.type === "running" ? '🏃‍♂️' : '🚴'} ${workout.description}`)
        .openPopup();
    }
    _renderWorkout(workout){

        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                    <h2 class="workout__title">${workout.description} </h2>
                    <div class="workout__details">
                        <span class="workout__icon">${workout.type === "running" ? '🏃‍♂️' : '🚴'}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">Km</span>
                    </div>
                    <div class="workout__detailed">
                        <span class="workout__icon">🕗</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                    </div>
                `;
            
        if(workout.type === "cycling"){
            html += `<div class="workout__details">
                        <span class="workout__icon"></span>
                        <span class="workout__value">${workout.speed.toFixed(1)}</span>
                        <span class="workout__unit">Km/H</span>
                    </div>
                    <div class="workout__detailed">
                        <span class="workout__icon">🚲</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                    </div>
                    </li>`;

        }
        if(workout.type === "running"){
            html += `<div class="workout__details">
                        <span class="workout__icon"></span>
                        <span class="workout__value">${workout.elevationGain}</span>
                        <span class="workout__unit">Km/M</span>
                    </div>
                    <div class="workout__detailed">
                        <span class="workout__icon">🏃‍♀️</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                    </div>
                    </li>`
        }

        form.insertAdjacentHTML('afterend',html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest(".workout");
        console.log(workoutEl)

        if(!workoutEl){
            return;
        }

        const workout = this.#workout.find(work => work.id === workoutEl.dataset.id)

        this.#map.setView(workout.coord,13, {
            animate: true,
            pan: {
                duration: 1
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workout))
    }

    _getStorageData(){
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data)
    }
}

const app = new App();

