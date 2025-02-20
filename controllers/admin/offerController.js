const Offer = require('../../models/offerSchema')



const loadOfferPage = async (req, res) => {
    try {
        const offers = await Offer.find({});
        
        
        const formattedOffers = offers.map(offer => ({
            ...offer.toObject(),
            createdDate: offer.createdDate.toLocaleString(),
            expiring: offer.expiring.toLocaleString()
        }));
        // console.log('offers',formattedOffers)

        res.render('offers', { offers: formattedOffers });
    } catch (error) {
        console.log('error loading offers page', error);
        res.status(500).send('Internal Server Error');
    }
};

const createOffer = async (req, res) => {
    try {
        const { title, discount, startDate, endDate } = req.body;

        const existingOffer = await Offer.findOne({ title });
        if (existingOffer) {
            return res.status(400).send('Offer with this title already exists');
        }

        const createdDate = new Date(startDate + "T00:00:00");
        const expiring = new Date(endDate + "T00:00:00");

        const newOffer = new Offer({
            name: title,
            discount: discount,
            createdDate: createdDate,
            expiring: expiring
        });
        await newOffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.log('error creating offer', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findByIdAndDelete(offerId);
        res.redirect('/admin/offers')
    } catch (error) {
        console.log('error deleting offer', error);
    }
}

// Controller: offerController.js

const editOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);
        
        if (!offer) {
            return res.status(404).render('editOffer', { 
                error: 'Offer not found',
                offer: {} 
            });
        }
        
        res.render('editOffer', { 
            offer,
            error: null
        });
    } catch (error) {
        console.error('Error Getting Offer Edit Page:', error);
        res.render('editOffer', {
            error: 'Something went wrong while loading the offer',
            offer: {}
        });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { title, discount, startDate, endDate } = req.body;
        const offerId = req.params.id;

        // Server-side validation
        if (!title || !discount || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (discount < 1 || discount > 100) {
            return res.status(400).json({
                success: false,
                message: 'Discount must be between 1 and 100'
            });
        }

        const startDateTime = new Date(startDate + "T00:00:00");
        const endDateTime = new Date(endDate + "T00:00:00");

        if (startDateTime > endDateTime) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be earlier than start date'
            });
        }

        const offer = await Offer.findById(offerId);
        
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        // Update offer
        offer.name = title;
        offer.discount = discount;
        offer.createdDate = startDateTime;
        offer.expiring = endDateTime;

        await offer.save();
        
        res.status(200).json({
            success: true,
            message: 'Offer updated successfully'
        });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update offer'
        });
    }
};


module.exports = {  loadOfferPage,
                    createOffer,
                    deleteOffer,
                    editOffer,
                    updateOffer };
                