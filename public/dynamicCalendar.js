export class DynamicCalendar{
    constructor(commonSlots = []) {
        this.currentDate = new Date();
        this.commonSlots = commonSlots;
        this.event = undefined;
        this.render();
    }

    getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    getFirstDayOfMonth(month, year) {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0-6 -> Mon-Sun
    }

    render() {
        const monthDiv = document.getElementById("month");
        const calendarGrid = document.getElementById("calendar-grid");

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();

        monthDiv.textContent = monthNames[month] + " " + year;

        calendarGrid.innerHTML = "";

        const daysInMonth = this.getDaysInMonth(month, year);
        const firstDayOfMonth = this.getFirstDayOfMonth(month, year);

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement("div");
            calendarGrid.appendChild(emptyDay);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement("button");
            day.textContent = i;
            day.setAttribute("id", `day-${i.toString().padStart(2, '0')}`);
            day.setAttribute("data-value", i.toString().padStart(2, '0'));
            day.classList.add("p-2", "rounded");
            if (this.highlightDays(this.commonSlots).includes(i)) {  
                day.classList.add("calendar-day", "text-blue-500", "font-semibold");
            }
            calendarGrid.appendChild(day);
            if (this.event) {
                day.addEventListener("click", () => this.event(day.getAttribute("data-value")));
            }
        }
        
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        prevButton.addEventListener('click', this.resetHighlight.bind(this));
        nextButton.addEventListener('click', this.resetHighlight.bind(this));
        

        

    }




    resetHighlight() {
        const days = document.querySelectorAll('.calendar-day');
        days.forEach(day => {
            day.classList.remove("calendar-day", "text-blue-500", "font-semibold");
        });
    }

    prevMonth() { 
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    highlightDays() {
        const daysToHighlight = Array.from(new Set(this.commonSlots.map(slot => parseInt(slot.slice(8, 10), 10))));
        return daysToHighlight;
    }

}
  
    
    


