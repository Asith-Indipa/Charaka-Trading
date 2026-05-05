/**
 * Three-wheeler vehicle data for Sri Lankan market.
 * Since no public API covers three-wheelers, this hardcoded dataset
 * provides brand and model information for the vehicle search dropdown.
 */

const threeWheelerData = {
    makes: [
        { id: 1, name: 'Bajaj' },
        { id: 2, name: 'TVS' },
        { id: 3, name: 'Piaggio' },
        { id: 4, name: 'Mahindra' },
        { id: 5, name: 'Force' },
        { id: 6, name: 'Atul' },
        { id: 7, name: 'Lohia' },
        { id: 8, name: 'YBY' },
        { id: 9, name: 'Qute (Bajaj)' },
        { id: 10, name: 'Other' },
    ],

    // Models mapped by make name (lowercase)
    models: {
        bajaj: [
            'RE 2 Stroke',
            'RE 4 Stroke',
            'RE Compact',
            'RE Maxima',
            'RE Maxima Z',
            'RE Optima',
            'RE Diesel',
            'Pulsar NS160 (Cargo)',
            'Compact 4S',
            'Maxima Cargo',
            'Maxima Z Cargo',
        ],
        tvs: [
            'TVS King',
            'TVS King Deluxe',
            'TVS King Duramax',
            'TVS King Cargo',
            'TVS King DX',
            'TVS King Kargo',
        ],
        piaggio: [
            'Ape City',
            'Ape Auto',
            'Ape Xtra',
            'Ape Xtra DLX',
            'Ape E-City',
            'Ape HT Cargo',
            'Ape Auto DX',
            'Ape City Plus',
        ],
        mahindra: [
            'Alfa Load',
            'Alfa Passenger',
            'Alfa Comfy',
            'Alfa Plus',
            'Treo',
            'Treo Zor',
            'Treo Yaari',
            'e-Alfa Mini',
            'e-Alfa Cargo',
        ],
        force: [
            'Trump',
            'Trump Plus',
            'Trump Super',
        ],
        atul: [
            'Gem',
            'Gem Paxx',
            'Gem Cargo',
            'Elite',
            'Elite Plus',
            'Smart',
        ],
        lohia: [
            'Comfort',
            'Comfort Plus',
            'Genius',
            'Humsafar',
            'Narain DLX',
        ],
        yby: [
            'YBY 200',
            'YBY 150',
        ],
        'qute (bajaj)': [
            'Qute Standard',
            'Qute CNG',
            'Qute LPG',
        ],
        other: [],
    },
};

export default threeWheelerData;
