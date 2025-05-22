import React, { useState } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Divider,
  TextField,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  Add as AddIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon
} from '@mui/icons-material';

const paymentMethods = [
  {
    id: 'cash',
    name: 'Cash',
    icon: <CashIcon />,
    description: 'Pay with cash after your ride'
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCardIcon />,
    description: 'Pay with saved card'
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: <BankIcon />,
    description: 'Pay using UPI'
  }
];

export default function PaymentOptions({ onSelectPayment }) {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleMethodChange = (event) => {
    setSelectedMethod(event.target.value);
    onSelectPayment(event.target.value);
  };

  const handleAddCard = () => {
    // In a real app, you would validate and process the card
    console.log('Adding new card:', newCard);
    setShowAddCard(false);
    // Notify parent component about the new payment method
    onSelectPayment('card');
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setNewCard(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Payment Method
      </Typography>
      
      <RadioGroup
        value={selectedMethod}
        onChange={handleMethodChange}
      >
        {paymentMethods.map((method) => (
          <Box key={method.id}>
            <FormControlLabel
              value={method.id}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>{method.icon}</Box>
                  <Box>
                    <Typography variant="body1">{method.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ width: '100%', py: 1 }}
            />
            {method.id !== paymentMethods[paymentMethods.length - 1].id && (
              <Divider sx={{ my: 1 }} />
            )}
          </Box>
        ))}
      </RadioGroup>

      {selectedMethod === 'card' && (
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={showAddCard ? <UpIcon /> : <AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => setShowAddCard(!showAddCard)}
            sx={{ mb: 1 }}
          >
            {showAddCard ? 'Cancel' : 'Add New Card'}
          </Button>
          
          <Collapse in={showAddCard}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mt: 1 }}>
              <TextField
                label="Card Number"
                fullWidth
                margin="dense"
                name="number"
                value={newCard.number}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
              />
              <TextField
                label="Cardholder Name"
                fullWidth
                margin="dense"
                name="name"
                value={newCard.name}
                onChange={handleCardInputChange}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  label="Expiry Date"
                  margin="dense"
                  name="expiry"
                  value={newCard.expiry}
                  onChange={handleCardInputChange}
                  placeholder="MM/YY"
                  sx={{ width: '50%' }}
                />
                <TextField
                  label="CVV"
                  margin="dense"
                  name="cvv"
                  value={newCard.cvv}
                  onChange={handleCardInputChange}
                  type="password"
                  sx={{ width: '50%' }}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleAddCard}
              >
                Add Card
              </Button>
            </Box>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
}
