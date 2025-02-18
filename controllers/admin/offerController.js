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

const editOffer = async (req,res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);
        if(!offer){
            res.json({message:"No Offers found"});
        }
        res.render('editOffer',{offer})
    } catch (error) {
        res.redirect('/pageError')
        console.log('Error Getting Offer Edit Page',error)
    }
}

const updateOffer = async (req, res) => {

    try {
        let {name,discount,createdDate,expiring} = req.body;
        const offerId = req.params.id;;
        const offer = await Offer.findByIdAndUpdate(offerId)
        console.log('offer',offer)
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
    

        offer.name = name
        offer.discount = discount
        offer.createdDate = new Date(createdDate + "T00:00:00");
        offer.expiring = new Date(expiring + "T00:00:00");

        await offer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.log('error updating product',error)
    }

}


module.exports = {  loadOfferPage,
                    createOffer,
                    deleteOffer,
                    editOffer,
                    updateOffer };
                