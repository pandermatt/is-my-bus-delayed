let from = localStorage.from || 'Wallisellen';
let to = localStorage.to || 'Flughafen';
let showTrain = false;
update();

function update() {
    let maxDelay = [0, 0, 0, 0];
    let nextDelay = [0, 0, 0, 0];
    let date = undefined;
    let nextDate = undefined;
    let current = undefined;
    let transfer = undefined;
    let transportations = '&transportations%5B%5D=bus&transportations%5B%5D=tram';
    if (showTrain) {
        transportations = '';
    }
    $.getJSON('https://transport.opendata.ch/v1/connections?from=' + from + '&to=' + to + '&fields%5B%5D=connections/sections/journey/name&fields%5B%5D=connections/sections/journey/operator&fields%5B%5D=connections/sections/journey&fields%5B%5D=connections/sections/walk&fields%5B%5D=connections/sections/journey/passList/delay&fields%5B%5D=connections/sections/journey/passList/departureTimestamp&fields%5B%5D=connections/products&limit=6' + transportations, function (data) {
        if (data.connections.length === 0) {
            swal({
                type: 'error',
                title: 'No connection found'
            });
            $('#message').html('No connection found');
            return;
        }
        $.each(data.connections, function (index, value) {
            let sections = value.sections.filter(function (item) {
                return item.walk == null;
            });

            if (current === undefined) {
                current = value.products;
                let $bus = $('#bus-first');
                $bus.html(value.products[0]);
                $bus.addClass(sections[0].journey.operator.replace(/\s/g, ''));
                if (value.products[1] !== undefined) {
                    let $busNext = $('#bus-next');
                    $busNext.html(value.products[1]);
                    $busNext.addClass(sections[1].journey.operator.replace(/\s/g, ''));
                }
            }
            if (value.products[0] === current[0]) {
                // console.log(value);
                let passList = sections[0].journey.passList;
                $.each(passList, function (_, value) {
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

                if (sections[1] !== undefined) {
                    let passListNext = sections[1].journey.passList;
                    if (transfer === undefined) {
                        let arrivalDate = new Date(passList[passList.length - 2].departureTimestamp * 1000);
                        let departureDate = new Date(passListNext[0].departureTimestamp * 1000);
                        transfer = Math.round(((departureDate - arrivalDate) / 1000) / 60) - maxDelay[0];
                    }
                    $.each(passListNext, function (_, value) {
                        if (value.delay > nextDelay[index]) {
                            nextDelay[index] = value.delay;
                        }
                    });
                }
            }
        });

        if (maxDelay[0] > 0) {
            $('#message').html("Yes");
            $('#delay').html(maxDelay[0] + "'")
        } else if (maxDelay[1] > 0) {
            $('#message').html("Probably");
            $('#delay').html(maxDelay[1] + "'")
        } else {
            $('#message').html("No");
            if (nextDelay[0]) {
                $('#delay').html($('#bus-next').html() + ": " + nextDelay[0] + "'")
            }
        }


        time = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
        if (transfer !== undefined) {
            time += " (<i class=\"fas fa-walking\"></i> " + transfer + "') ";
        }
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
        from = formValues[0];
        to = formValues[1];
        localStorage.from = from;
        localStorage.to = to;
        reset();
        update();

        swal({
            position: 'top-end',
            type: 'success',
            title: 'Settings has been saved',
            showConfirmButton: false,
            timer: 1500
        })
    }
}

function showConnection() {
    url = "https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?von="
        + localStorage.from + "&nach=" + localStorage.to;
    window.open(url, '_blank');
}

function toggleTrain() {
    showTrain = !showTrain;
    localStorage.showTrain = showTrain;
    $('.show-train').toggleClass('is-rounded');
    if (showTrain) {
        $('.show-train-text').html('Hide Train');
    } else {
        $('.show-train-text').html('Show Train');
    }
    reset();
    update();
}

function reset() {
    $('#message').html("...");
    $('#departure').html("");
    $('#delay').html("");
    let $bus = $('#bus-first');
    let $busNext = $('#bus-next');
    $bus.html("<div class=\"sp sp-3balls\"></div>");
    $busNext.html("");
    $bus.attr('class', 'bus-label');
    $busNext.attr('class', 'bus-label bus-label-next');
}

function refresh() {
    reset();
    update();
}

$(document).ready(function () {
    $('.navbar-burger').click(function () {
        $('.navbar-burger').toggleClass('is-active');
        $('.navbar-menu').toggleClass('is-active');
    });
});
