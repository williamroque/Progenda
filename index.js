const container = document.querySelector('#agenda');
const datePattern = /(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{2}):(\d{2}):(\d{2}))?/;


function parseDate(rawDate) {
    const date = new Date();

    const [
        year, month, day,
        hour, minute, second,
        ...rest
    ] = rawDate.match(datePattern).slice(1);

    date.setFullYear(year);
    date.setMonth((month | 0) - 1);
    date.setDate(day);

    date.setHours(hour || 0, minute || 0, second || 0);

    return date;
}

function parseAgenda(root, category) {
    let agenda = [];

    for (const section of root.contents) {
        if (section.type === 'headline') {
            const props = section.properties;
            category = section.drawer.CATEGORY || category;

            let entry = { category: category };

            entry.title = props.title[0];
            entry.done = props['todo-type'] === 'done';
            entry.todo = props['todo-type'] === 'todo' || entry.done;

            if ('scheduled' in props) {
                entry.scheduled = parseDate(props.scheduled.start);
            }

            if ('deadline' in props) {
                entry.deadline = parseDate(props.deadline.start);
            }

            const potentialTimestamp = section?.contents[0]?.contents[0]?.contents[0];

            if (potentialTimestamp?.type === 'timestamp') {
                entry.timestamp = parseDate(potentialTimestamp.properties.start);
            }

            if ('scheduled' in entry || 'deadline' in entry || 'timestamp' in entry) {
                agenda.push(entry);
            }

            if (section.contents) {
                agenda = agenda.concat(parseAgenda(section, category));
            }
        }
    }

    return agenda;
}

function sortAgenda(agenda) {
    const today = new Date();

    let sorted = {};

    for (const entry of agenda) {
        const date = entry?.timestamp || entry?.scheduled || entry?.deadline;

        if (date >= today || (entry.todo && !entry.done)) {
            if (date < today) {
                date.setDate(today.getDate());
                date.setMonth(today.getMonth());
                date.setFullYear(today.getFullYear());
            }

            const key = Math.floor(date.getTime() / 1000) * 1000;

            if (key in sorted) {
                sorted[key].push(entry);
            } else {
                sorted[key] = [entry];
            }
        }
    }

    return sorted;
}

function formatDate(time) {
    const date = new Date();
    date.setTime(time);

    const weekday = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ][date.getDay()];

    const day = date.getDate();
    const month = 'January February March April May June July August September October November December'.split(' ')[date.getMonth()];
    const year = date.getFullYear();

    return `${weekday}, ${day} ${month} ${year}`;
}

function render(agenda) {
    const sortedKeys = Object.keys(agenda).sort();

    for (const key of sortedKeys) {
        const sectionElement = document.createElement('div');
        sectionElement.classList.add('section');

        const sectionTitleElement = document.createElement('h1');
        sectionTitleElement.classList.add('section-title');
        sectionTitleElement.innerText = formatDate(key);
        sectionElement.appendChild(sectionTitleElement);

        const section = agenda[key];

        for (const entry of section) {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');

            if (entry.todo) {
                rowElement.classList.add('todo');
            }

            if (entry.done) {
                rowElement.classList.add('done');
            }

            const leftContainer = document.createElement('div');
            leftContainer.classList.add('left-container');

            const rowTitleElement = document.createElement('div');
            rowTitleElement.classList.add('row-title');
            rowTitleElement.innerText = entry.title;
            leftContainer.appendChild(rowTitleElement);

            const rowCategoryElement = document.createElement('div');
            rowCategoryElement.classList.add('row-category');
            rowCategoryElement.innerText = entry.category;
            leftContainer.appendChild(rowCategoryElement);

            const rightContainer = document.createElement('div');
            rightContainer.classList.add('right-container');

            const date = entry?.timestamp || entry?.scheduled || entry?.deadline;
            const rowTimeElement = document.createElement('div');
            rowTimeElement.classList.add('row-time');
            rowTimeElement.innerText = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            rightContainer.appendChild(rowTimeElement);

            if (entry.todo) {
                const rowTODOElement = document.createElement('div');
                rowTODOElement.classList.add('row-todo');
                rowTODOElement.innerText = entry.done ? 'DONE' : 'TODO';
                rightContainer.appendChild(rowTODOElement);
            }

            rowElement.appendChild(leftContainer);
            rowElement.appendChild(rightContainer);

            sectionElement.appendChild(rowElement);
        }

        container.appendChild(sectionElement);
    }
}

const agenda = sortAgenda(parseAgenda(data));

render(agenda);
