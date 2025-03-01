const countries = ["USA", "Canada", "Mexico", "France", "Germany", "Spain", "Italy", "Australia", "Japan", "China"]; // Add more countries as needed

function filterCountries() {
    const input = document.querySelector('.serach-in').value.toLowerCase();
    const filteredCountries = countries.filter(country => country.toLowerCase().includes(input));
    
    // For demonstration, log the filtered countries
    console.log(filteredCountries);
}
