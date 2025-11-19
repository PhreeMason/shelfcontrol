import { Calendar, CheckCircle, ChevronUp, Edit3, FileText } from 'lucide-react';
import React, { useState } from 'react';

const ImprovedDeadlineCard = ({ book, isExpanded, onToggle }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(book.dueDate);
  const [currentProgress, setCurrentProgress] = useState(book.currentProgress);
  const [toggleView, setToggleView] = useState('remaining'); // remaining, current, pages

  // Calculate values based on format and toggle view
  const getDisplayValue = () => {
    if (book.format === 'time') {
      const totalMinutes = book.total;
      const progressMinutes = currentProgress;
      const remainingMinutes = totalMinutes - progressMinutes;
      
      if (toggleView === 'remaining') {
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        return `${hours}h ${mins}m`;
      } else {
        const hours = Math.floor(progressMinutes / 60);
        const mins = progressMinutes % 60;
        return `${hours}h ${mins}m`;
      }
    } else {
      const remainingPages = book.total - currentProgress;
      return toggleView === 'current' ? currentProgress : remainingPages;
    }
  };

  const getToggleLabel = () => {
    if (book.format === 'time') {
      return toggleView === 'remaining' ? 'TIME LEFT' : 'CURRENT POSITION';
    } else {
      return toggleView === 'current' ? 'CURRENT PAGE' : 'PAGES LEFT';
    }
  };

  const percentage = Math.round((currentProgress / book.total) * 100);

  const handleScrubberChange = (e) => {
    const value = parseInt(e.target.value);
    setCurrentProgress(value);
  };

  const formatScrubberValue = (value) => {
    if (book.format === 'time') {
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      return `${hours}h ${mins}m`;
    }
    return value;
  };

  const handleQuickDate = (days) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setShowDatePicker(false);
  };

  return (
    <div className="mb-4">
      <div 
        className={`bg-white rounded-3xl shadow-md overflow-hidden transition-all duration-300 ${isExpanded ? 'pb-4' : ''}`}
        style={{ 
          height: isExpanded ? 'auto' : '120px',
        }}
      >
        {/* Collapsed State */}
        <div 
          className="p-4 cursor-pointer"
          onClick={!isExpanded ? onToggle : undefined}
        >
          <div className="flex gap-3">
            {/* Book Cover Thumbnail */}
            <img 
              src={book.cover} 
              alt={book.title}
              className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
            />
            
            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight mb-1 truncate">{book.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: book.status === 'reading' ? '#B8A9D9' : '#F5C2A1',
                    color: 'white'
                  }}
                >
                  {book.status === 'reading' ? 'Reading' : 'Paused'}
                </span>
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: '#E8C2B9' }}>
                {book.format === 'time' ? `${book.dailyNeeded} minutes/day` : `${book.dailyNeeded} pages/day`} needed
              </div>
              <div className="text-xs text-gray-500">Due: {selectedDate}</div>
            </div>

            {/* Days Badge */}
            <div 
              className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
              style={{ backgroundColor: '#F5F1EA' }}
            >
              <div className="text-2xl font-bold" style={{ color: '#B8A9D9' }}>
                {book.daysLeft}
              </div>
              <div className="text-xs text-gray-500">days</div>
            </div>
          </div>

          {/* Progress Bar - Only in collapsed state */}
          {!isExpanded && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{percentage}%</span>
                <span>
                  {book.format === 'time' 
                    ? `${formatScrubberValue(book.total - currentProgress)} left`
                    : `${book.total - currentProgress} pages left`
                  }
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: '#B8A9D9'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Expanded State */}
        {isExpanded && (
          <div className="px-4">
            {/* Toggle Metric Card */}
            <div 
              className="bg-white rounded-2xl p-4 mb-4 text-center cursor-pointer shadow-sm"
              onClick={() => setToggleView(book.format === 'time' 
                ? (toggleView === 'remaining' ? 'current' : 'remaining')
                : (toggleView === 'current' ? 'remaining' : 'current')
              )}
            >
              <div className="text-xs font-semibold text-gray-400 mb-1">{getToggleLabel()}</div>
              <div className="text-5xl font-bold mb-1" style={{ color: '#B8A9D9' }}>
                {getDisplayValue()}
              </div>
              <div className="text-sm text-gray-500">{percentage}% complete</div>
            </div>

            {/* Progress Scrubber */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{formatScrubberValue(currentProgress)}</span>
                <span>
                  {book.format === 'time'
                    ? toggleView === 'current' 
                      ? formatScrubberValue(book.total - currentProgress) + ' left'
                      : formatScrubberValue(book.total)
                    : book.total + (book.format === 'pages' ? ' pages' : '')
                  }
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={book.total}
                value={currentProgress}
                onChange={handleScrubberChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #B8A9D9 0%, #B8A9D9 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Started: {book.startedDate}</span>
                <span>Due: {selectedDate}</span>
              </div>
            </div>

            {/* Save Button - Now above action buttons */}
            <button 
              className="w-full py-3 rounded-2xl font-semibold text-white shadow-sm hover:shadow-md transition-all mb-4"
              style={{ backgroundColor: '#B8A9D9' }}
            >
              Save
            </button>

            {/* Action Buttons - Now below Save button */}
            <div className="flex justify-center gap-4 mb-3">
              {/* Status Button */}
              <button className="flex flex-col items-center justify-center w-16 hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <CheckCircle size={20} style={{ color: '#B8A9D9' }} />
                </div>
                <span className="text-xs text-gray-600">Status</span>
              </button>

              {/* Calendar Button */}
              <div className="relative">
                <button 
                  className="flex flex-col items-center justify-center w-16 hover:opacity-70 transition-opacity"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <Calendar size={20} style={{ color: '#B8A9D9' }} />
                  </div>
                  <span className="text-xs text-gray-600">Due Date</span>
                </button>
                
                {/* Inline Date Picker */}
                {showDatePicker && (
                  <div 
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-lg p-3 z-10 w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-2">Quick Change</div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button 
                        onClick={() => handleQuickDate(7)}
                        className="py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-100"
                        style={{ backgroundColor: '#F5F1EA' }}
                      >
                        +7 days
                      </button>
                      <button 
                        onClick={() => handleQuickDate(14)}
                        className="py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-100"
                        style={{ backgroundColor: '#F5F1EA' }}
                      >
                        +14 days
                      </button>
                      <button 
                        onClick={() => handleQuickDate(30)}
                        className="py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-100"
                        style={{ backgroundColor: '#F5F1EA' }}
                      >
                        +30 days
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 text-center">Tap outside to close</div>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button className="flex flex-col items-center justify-center w-16 hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <Edit3 size={20} style={{ color: '#B8A9D9' }} />
                </div>
                <span className="text-xs text-gray-600">Edit</span>
              </button>

              {/* Notes Button */}
              <button className="flex flex-col items-center justify-center w-16 hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <FileText size={20} style={{ color: '#B8A9D9' }} />
                </div>
                <span className="text-xs text-gray-600">Notes</span>
              </button>
            </div>

            {/* Collapse Button */}
            <button 
              onClick={onToggle}
              className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronUp size={16} />
              Collapse
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ShelfControlImprovedHome = () => {
  const [expandedId, setExpandedId] = useState(null);

  const books = [
    {
      id: 1,
      title: "Blue Ocean Shift: Beyond Competing",
      cover: "https://m.media-amazon.com/images/I/71F4SIKlEvL._SL1500_.jpg",
      format: 'time',
      currentProgress: 241,
      total: 589,
      daysLeft: 22,
      dueDate: "Nov 30, 2025",
      startedDate: "6 days ago",
      status: 'reading',
      dailyNeeded: 16
    },
    {
      id: 2,
      title: "Overlord Special Edition: Phantom Ship of Katze",
      cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1649660613i/60099325.jpg",
      format: 'pages',
      currentProgress: 49,
      total: 82,
      daysLeft: 11,
      dueDate: "Nov 19, 2025",
      startedDate: "2 weeks ago",
      status: 'paused',
      dailyNeeded: 3
    }
  ];

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#F5F1EA' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">Saturday, November 8</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Today's Reading Goals</h1>
        
        {/* Daily Goals Summary */}
        <div className="bg-white rounded-3xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📖</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-700">Reading</span>
                <span className="text-gray-500 font-medium">0/29</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: '#E8C2B9' }} />
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 text-right" style={{ color: '#E8C2B9' }}>29 pages left</div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 whitespace-nowrap shadow-sm">
            Pending (7)
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap shadow-sm" style={{ backgroundColor: '#B8A9D9' }}>
            Active (10)
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-600 whitespace-nowrap shadow-sm">
            Paused (8)
          </button>
        </div>
      </div>

      {/* Book Cards */}
      <div>
        {books.map(book => (
          <ImprovedDeadlineCard
            key={book.id}
            book={book}
            isExpanded={expandedId === book.id}
            onToggle={() => setExpandedId(expandedId === book.id ? null : book.id)}
          />
        ))}
      </div>

      {/* Design Notes */}
      <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-3" style={{ color: '#B8A9D9' }}>Final Design - Button Order</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">✨ Visual Hierarchy:</strong>
            <p>1. Metric Card (5h 48m - primary info)</p>
            <p>2. Progress Scrubber (update progress)</p>
            <p>3. Save Button (primary action - most important)</p>
            <p>4. Secondary Actions (Status, Calendar, Edit, Notes)</p>
            <p>5. Collapse Button</p>
          </div>
          
          <div>
            <strong className="text-gray-900">🎯 Why Save Button on Top:</strong>
            <p>• Most frequent action after scrubber adjustment</p>
            <p>• Natural flow: Update → Save → Secondary edits</p>
            <p>• Prominent CTA doesn't get lost</p>
            <p>• Matches expected "confirm changes" pattern</p>
          </div>

          <div>
            <strong className="text-gray-900">🔧 Secondary Actions Below:</strong>
            <p>• Less frequent operations (change status, edit details)</p>
            <p>• Still easily accessible but not primary focus</p>
            <p>• Calendar picker appears above buttons to stay visible</p>
            <p>• Clean separation between "save progress" and "modify book"</p>
          </div>
          
          <div>
            <strong className="text-gray-900">📱 User Flow:</strong>
            <p>1. Tap card to expand</p>
            <p>2. Drag scrubber to update progress</p>
            <p>3. Tap Save (most common path)</p>
            <p>4. OR tap Status/Calendar/Edit/Notes for other changes</p>
            <p>5. Tap Collapse to close</p>
          </div>

          <div>
            <strong className="text-gray-900">💡 Calendar Positioning:</strong>
            <p>• Date picker appears ABOVE buttons (bottom-full)</p>
            <p>• Prevents picker from being cut off at screen bottom</p>
            <p>• Always visible when open</p>
            <p>• Stays within card bounds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfControlImprovedHome;