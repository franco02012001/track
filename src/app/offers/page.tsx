'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { applicationsApi, Application } from '@/lib/api';

export default function OffersPage() {
  const [offers, setOffers] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const allApplications = await applicationsApi.getAll();
      const offerApplications = allApplications.filter(app => app.status === 'Offer');
      setOffers(offerApplications);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Offers</h1>
          <p className="text-gray-600">View and manage your job offers</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-600">Keep applying! Your offers will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {offers.map((offer) => (
              <div key={offer._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{offer.jobTitle}</h3>
                    <p className="text-lg text-gray-600 mb-2">{offer.company}</p>
                    {offer.location && <p className="text-gray-500 mb-2">{offer.location}</p>}
                    {offer.salary && <p className="text-green-600 font-semibold mb-2">${offer.salary}</p>}
                    {offer.notes && <p className="text-gray-600 mt-4">{offer.notes}</p>}
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                    Offer
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
