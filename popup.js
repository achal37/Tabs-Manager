document.addEventListener('DOMContentLoaded', () => {
    const collapseToggle = document.querySelector('#collapseToggle');
    const sidebar = document.querySelector('.sidebar');
    const tabList = document.querySelector('.tab-list');
    const input = document.querySelector('#groupInput');
    const button = document.querySelector('#groupButton');
    let isSidebarCollapsed = false;

    collapseToggle.addEventListener('change', () => {
        isSidebarCollapsed = collapseToggle.checked;
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    });

    button.addEventListener('click', async () => {
        const inputValue = input.value.trim();

        if (inputValue.startsWith('group')) {
            const tabFlagIndex = inputValue.indexOf('-t');
            const nameFlagIndex = inputValue.indexOf('-n');

            let tabNumbers = [];
            let groupName = '';

            if (tabFlagIndex !== -1) {
                const tabNumbersString = inputValue.slice(tabFlagIndex + 2, nameFlagIndex !== -1 ? nameFlagIndex : undefined).trim();
                tabNumbers = parseTabNumbers(tabNumbersString);
            }

            if (nameFlagIndex !== -1) {
                groupName = inputValue.slice(nameFlagIndex + 2).trim();
            }

            if (tabNumbers.length === 0 && groupName) {
                // Create an empty group with the provided group name
                alert("An empty group without any tab is not possible!\n \t\t Try something else!");
            } else {
                const tabIds = await getTabIds(tabNumbers);

                if (tabIds.length) {
                    if (groupName) {
                        // Create a group with the provided group name
                        const group = await chrome.tabs.group({ tabIds });
                        await chrome.tabGroups.update(group, { title: groupName });
                    } else {
                        // Create an empty group
                        const group = await chrome.tabs.group({ tabIds });
                    }
                }
            }
        }

        input.value = '';
    });

    input.addEventListener('keypress', (event) => {
        // Event listener for Enter key press in the input field
        if (event.key === 'Enter') {
            button.click(); // Simulate clicking the Group button
        }
    });

    const parseTabNumbers = (tabNumbersString) => {
        const ranges = tabNumbersString.split(',');

        const tabNumbers = ranges.reduce((result, range) => {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    result.push(i);
                }
            } else {
                result.push(Number(range));
            }
            return result;
        }, []);

        return tabNumbers;
    };

    const getTabIds = async (tabNumbers) => {
        const tabs = await chrome.tabs.query({ url: 'https://*/*' });

        const sortedTabs = tabs.sort((a, b) => a.index - b.index);

        const tabIds = sortedTabs
            .filter((_, index) => tabNumbers.includes(index + 1))
            .map(({ id }) => id);

        return tabIds;
    };

    chrome.tabs.query({ url: '<all_urls>' }, (tabs) => {
        const collator = new Intl.Collator();
        const sortedTabs = tabs.sort((a, b) => collator.compare(a.title, b.title));

        for (let i = 0; i < sortedTabs.length; i++) {
            const tab = sortedTabs[i];

            const listItem = document.createElement('li');
            const tabInfoContainer = document.createElement('div');
            tabInfoContainer.classList.add('tab-info');

            const tabNumberElement = document.createElement('span');
            tabNumberElement.textContent = `${i + 1}.`;
            tabNumberElement.classList.add('tab-number');

            const icon = document.createElement('img');
            icon.classList.add('icon');
            icon.src = tab.favIconUrl || '/images/browser.png'; // Use the tab's icon or default icon if not available
            icon.alt = '_';

            const title = document.createElement('h3');
            title.classList.add('title');
            title.textContent = tab.title;

            tabInfoContainer.appendChild(tabNumberElement);
            tabInfoContainer.appendChild(icon);
            tabInfoContainer.appendChild(title);

            listItem.appendChild(tabInfoContainer);
            tabList.appendChild(listItem);
        }
})});
