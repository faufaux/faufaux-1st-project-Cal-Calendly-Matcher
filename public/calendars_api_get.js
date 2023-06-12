import { DynamicCalendar } from './dynamicCalendar.js';

class MatchingSlots {
  constructor(calendar){
    this.launchButton = document.getElementById("launch_button");
    this.prevButton = document.getElementById("prev-button");
    this.nextButton = document.getElementById("next-button");
    this.loader = document.getElementById('loader');
    this.loader.style.display = 'none';

    this.calendar = calendar
    this.timeZoneUser = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
    this.calLink = null;
    this.calendlyLink = null;
    

    this.monthText = document.getElementById('month').innerText; 
    const {month, year} = this.parseMonthText();
    this.month = month;
    this.year = year;

    const { startTime, endTime } = this.getStartAndEndDates();
    this.startTime = startTime;
    this.endTime = endTime;


    this.container = document.getElementById('commonSlotsContainer');
    this.displayTitle = `<h1 class="fade-in text-3xl font-bold mb-6">Matching Slots</h1>`;
    this.displayTitleContainer = document.getElementById('matchingSlotTitle');
  
    this.data_calendars = {
      eventTypeId: null,
      eventTypeSlug: '30min',
      usernameList: null,
      startTime: this.startTime,
      endTime: this.endTime,
      timeZone_calendars: this.timeZoneUser,
      duration: 30,
      eventTypeId_calendly: null,
      diagnostics: false,
    }; 

    this.result_cal = [];
    this.result_calendly = [];
    this.calSlots = [];
    this.calendlySlots = [];
    this.commonSlots = [];
    
    this.initButtonsClicks();
    this.updateTimeZoneOption();

  }
  
  initButtonsClicks() {
    this.launchButton.addEventListener("click", () => {
      this.refreshCommonSlot();
    });

     this.prevButton.addEventListener("click", () => {
      this.refreshCommonSlot();
      this.calendar.prevMonth();
    });

    this.nextButton.addEventListener("click", () => {
      this.refreshCommonSlot();
      this.calendar.nextMonth();
    });
  
  }

  async refreshCommonSlot(){
    this.loader.style.display = 'flex'; // Affiche le loader
    this.container.innerHTML = '';
    this.displayTitleContainer.innerHTML = '';

    this.calLink = document.getElementById('cal_link').value;
    this.data_calendars.usernameList = this.calLink.split('/')[3];
    this.calendlyLink = document.getElementById('calendly_link').value;
    this.data_calendars.eventTypeId = await this.fetchEventTypeId();
    this.data_calendars.eventTypeId_calendly = await this.fetchEventTypeIdCalendly();
    
      
    this.monthText = document.getElementById('month').innerText;
    const {month, year} = this.parseMonthText();
    this.month = month;
    this.year = year;
    const { startTime, endTime } = this.getStartAndEndDates();
    this.startTime = startTime;
    this.endTime = endTime;

    await this.refreshContainerCommonSlot();
    this.calendar.commonSlots = this.commonSlots;
    this.calendar.render();
  }

async refreshContainerCommonSlot() {
  this.loader.style.display = 'flex'; // Affiche le loader
  this.container.innerHTML = '';
  this.displayTitleContainer.innerHTML = '';
  
  this.result_cal = await this.fetchSchedule();
  this.result_calendly = await this.fetchScheduleCalendly();
  this.calSlots = this.convertCalSlots();
  this.calendlySlots = await this.convertCalendlySlots();
  this.commonSlots = this.findCommonSlots();
  
  if (this.commonSlots.length === 0) {
    const noCommonSlotMessage = document.createElement('div');
    noCommonSlotMessage.className = 'text-center text-gray-600';
    noCommonSlotMessage.textContent = 'Apologies, no common slot available :(';
    this.container.appendChild(noCommonSlotMessage);
  }
  const slotElements = {};
  for (let slot of this.commonSlots) {
      const [date, time] = slot.split(' ');
      const [year, month, day] = date.split('/');

      const dateId = `${day}${month}${year}`;

      if (!slotElements[dateId]) {
          const slotElement = document.createElement('div');
          slotElement.className = 'fade-in p-6 bg-white rounded shadow mb-4 flex flex-col items-center';

          const slotDate = document.createElement('h3');
          slotDate.className = 'text-xl font-bold mb-2';
          slotDate.textContent = `${day}/${month}/${year}`;
          slotElement.appendChild(slotDate);

          const timeButtonsContainer = document.createElement('div');
          timeButtonsContainer.className = 'flex flex-row flex-wrap justify-center gap-2';
          slotElement.appendChild(timeButtonsContainer);

          this.container.appendChild(slotElement);
          slotElements[dateId] = timeButtonsContainer;
      }

      const timeButtonContainer = document.createElement('div');
      timeButtonContainer.className = 'w-20 h-10 flex justify-center items-center';

      const timeButton = document.createElement('button');
      timeButton.className = 'px-4 py-2 bg-blue-500 text-white font-semibold rounded';
      timeButton.textContent = time.slice(1, -1);  // Remove [ and ] from the time string

      timeButtonContainer.appendChild(timeButton);
      slotElements[dateId].appendChild(timeButtonContainer);
  }
    this.displayTitleContainer.innerHTML = this.displayTitle;
    this.loader.style.display = 'none';
}

  parseMonthText() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const [month, year] = this.monthText.split(' ');
    return {
      month: monthNames.indexOf(month) + 1,
      year: parseInt(year)
    };
  }
    
  getStartAndEndDates() {
    const date = new Date(this.year, this.month, 0);
    const startTime = `${this.year}-${String(this.month).padStart(2, '0')}-01`;
    const endTime = `${this.year}-${String(this.month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { 
      startTime, 
      endTime 
    };
  }

  fetchSchedule() {
    const url = `https://cal.com/api/trpc/public/slots.getSchedule?input=%7B%22json%22%3A%7B%22eventTypeId%22%3A${this.data_calendars.eventTypeId}%2C%22eventTypeSlug%22%3A%22${this.data_calendars.eventTypeSlug}%22%2C%22usernameList%22%3A%5B%22${this.data_calendars.usernameList}%22%5D%2C%22startTime%22%3A%22${this.startTime}T00%3A00%3A00.000Z%22%2C%22endTime%22%3A%22${this.endTime}T23%3A59%3A59.999Z%22%2C%22timeZone%22%3A%22${this.data_calendars.timeZone_calendars}%22%2C%22duration%22%3A%22${this.data_calendars.duration}%22%7D%7D`;
    return this.fetchJsonFromUrl(url);
  }
  
  fetchScheduleCalendly() {
    const url = `https://calendly.com/api/booking/event_types/${this.data_calendars.eventTypeId_calendly}/calendar/range?timezone=${this.data_calendars.timeZone_calendars}&diagnostics=${this.data_calendars.diagnostics}&range_start=${this.startTime}&range_end=${this.endTime}`;
    return this.fetchJsonFromUrl(url);
  }
  
  async fetchJsonFromUrl(url) {
    const response = await fetch(url);
    const result = await response.json();
    return result;
  }
  
  
  async fetchEventTypeId() {
    const response = await fetch(this.calLink);
    const text = await response.text();
    const regex = /("id":)([0-9]+)/;
    const match = text.match(regex);
    return match[2];
  }
  async fetchEventTypeIdCalendly() {
    const response = await fetch(this.calendlyLink);
    const text = await response.text();
    const regex = /("uuid":)("[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}")/;
    const match = text.match(regex);
    return match[2].replaceAll('"', '');
  }
  
  updateTimeZoneOption() {
    const selectTimeZone = document.getElementById('select_time_zone');
    selectTimeZone.textContent = decodeURIComponent(this.timeZoneUser);
}

  convertCalSlots() {
      const slots = Object.values(this.result_cal.result.data.json.slots).flat();
      return slots.map(slot => {
          const date = slot.time.split('T')[0].replace(/-/g, '/');
          const time = slot.time.split('T')[1].split(':').slice(0, 2).join(':');
          return `${date} [${time}]`;
      });
  }

  async convertCalendlySlots() {
      const availableStartTimes = [];
    
      this.result_calendly.days.forEach(day => {
        if (day.status === 'available') {
          day.spots.forEach(spot => {
            if (spot.status === 'available') {
              const startTime = new Date(spot.start_time);
              const formattedStartTime = `${startTime.getFullYear()}/${(startTime.getMonth() + 1).toString().padStart(2, '0')}/${startTime.getDate().toString().padStart(2, '0')} [${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}]`;
              availableStartTimes.push(formattedStartTime);
            }
          });
        }
      });
    
      return availableStartTimes;
  }


  findCommonSlots() {
      return this.calSlots.filter(slot => this.calendlySlots.includes(slot));
  }

  async dayClicked(day) {
    this.startTime = `${this.year}-${String(this.month).padStart(2, '0')}-${day}`;
    this.endTime = `${this.year}-${String(this.month).padStart(2, '0')}-${day}`;
    this.refreshContainerCommonSlot();
  }
    

}

const calendar = new DynamicCalendar([]);

const matchingslots = new MatchingSlots(calendar);

calendar.event = matchingslots.dayClicked.bind(matchingslots); ;

