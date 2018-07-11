const from = localStorage.from || 'Wallisellen';
const to = localStorage.to || 'Flughafen';
update();

function update() {
    let maxDelay = [0, 0, 0, 0];
    let date = undefined;
    let nextDate = undefined;
    let current = undefined;
    var walk = false;
    $.getJSON('https://transport.opendata.ch/v1/connections?from=' + from + '&to=' + to + '&fields%5B%5D=connections/sections/journey/name&fields%5B%5D=connections/sections/journey/operator&fields%5B%5D=connections/sections/journey&fields%5B%5D=connections/sections/walk&fields%5B%5D=connections/sections/journey/passList/delay&fields%5B%5D=connections/sections/journey/passList/departureTimestamp&fields%5B%5D=connections/products&limit=4&transportations%5B%5D=bus&transportations%5B%5D=tram', function (data) {
        $.each(data.connections, function (index, value) {
            let sections = value.sections.filter(function (item) {
                return item.walk == null;
            });

            if (current === undefined) {
                current = value.products;
                $('#bus-first').html(value.products[0]);
                $('#bus-first').addClass(sections[0].journey.operator.replace(/\s/g, ''));
                if (value.products[1] != undefined) {
                    $('#bus-next').html(value.products[1]);
                    $('#bus-next').addClass(sections[1].journey.operator.replace(/\s/g, ''));
                }
            }
            if (value.products[0] == current[0]) {
                $.each(sections[0].journey.passList, function (_, value) {
                    if (date === undefined) {
                        date = new Date(value.departureTimestamp * 1000);
                    }
                    if (index > 1 && nextDate === undefined) {
                        nextDate = new Date(value.departureTimestamp * 1000);
                    }
                    if (value.delay > maxDelay[index]) {
                        maxDelay[index] = value.delay;
                    }
                });
            }
        });

        if (maxDelay[0] > 0) {
            $('#message').html("Yes");
            $('#delay').html(maxDelay[0] + "'")
        } else if (maxDelay[1] > 0) {
            $('#message').html("Probability");
            $('#delay').html(maxDelay[1] + "'")
        } else {
            $('#message').html("No");
        }


        time = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
        if (nextDate !== undefined) {
            time += " - Next: " +
                ("0" + nextDate.getHours()).slice(-2) + ":" + ("0" + nextDate.getMinutes()).slice(-2);
        }
        $('#departure').html(time);
    });
}

async function showSettings() {
    const {value: formValues} = await swal({
        title: 'From To?',
        html:
        '<input id="swal-input1" class="swal2-input" value="' + from + '">' +
        '<input id="swal-input2" class="swal2-input" value="' + to + '">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ]
        }
    });

    if (formValues) {
        localStorage.from = formValues[0];
        localStorage.to = formValues[1];
        location.reload();
    }
}

function showConnection() {
    url = "https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?von="
        + localStorage.from + "&nach=" + localStorage.to
    window.open(url, '_blank');
}