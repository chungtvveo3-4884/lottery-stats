// No changes needed for simulationController.js
// controllers/simulationController.js

// Dummy data store for simulations - replace with a database in a real app
let simulations = []; 
let nextId = 1;

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

exports.getSimulationPage = (req, res) => {
    const lotteryData = req.app.get('lotteryData');
    if (!lotteryData || lotteryData.length === 0) {
        return res.status(500).send("Không có dữ liệu xổ số");
    }

    const latestDate = new Date(lotteryData[lotteryData.length - 1].date);
    const predictionDate = new Date(latestDate);
    predictionDate.setDate(latestDate.getDate() + 1);
    
    // Simple result calculation for history
    const historyWithResults = simulations.map(sim => {
        const resultDate = new Date(sim.date);
        const resultData = lotteryData.find(d => new Date(d.date).getTime() === resultDate.getTime());
        if(resultData){
            sim.hasResult = true;
            // Simplified win/loss calculation
            let winLose = 0;
            if (sim.danh && sim.danh.numbers.length > 0) {
                const winningNumber = resultData.specialPrize.slice(-2);
                if (sim.danh.numbers.includes(winningNumber)) {
                    winLose += sim.danh.amount * 70; // Assuming a win pays 70x
                }
                winLose -= sim.danh.numbers.length * sim.danh.amount;
            }
             if (sim.om && sim.om.numbers.length > 0) {
                const winningNumber = resultData.specialPrize.slice(-2);
                if (sim.om.numbers.includes(winningNumber)) {
                     winLose -= sim.om.amount * 70;
                }
                 winLose += sim.om.numbers.length * sim.om.amount;
            }
            sim.winLose = winLose;
        } else {
            sim.hasResult = false;
        }
        return sim;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render('simulation', {
        latestDate: latestDate.toISOString(),
        predictionDate: predictionDate.toISOString(),
        history: historyWithResults,
        formatDate: formatDate
    });
};

exports.submitSimulation = (req, res) => {
    const { danhNumbers, danhAmount, omNumbers, omAmount } = req.body;
    
    const lotteryData = req.app.get('lotteryData');
    const latestDate = new Date(lotteryData[lotteryData.length - 1].date);
    const predictionDate = new Date(latestDate);
    predictionDate.setDate(latestDate.getDate() + 1);

    // Prevent duplicate simulation for the same day
    if (simulations.some(s => new Date(s.date).getTime() === predictionDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Đã có giả lập cho ngày này rồi.' });
    }

    const newSimulation = {
        id: nextId++,
        date: predictionDate.toISOString(),
        danh: {
            numbers: danhNumbers || [],
            amount: parseInt(danhAmount) || 0
        },
        om: {
            numbers: omNumbers || [],
            amount: parseInt(omAmount) || 0
        },
        hasResult: false
    };
    simulations.push(newSimulation);
    res.json({ success: true, message: 'Lưu giả lập thành công!' });
};

exports.editSimulation = (req, res) => {
    const { id } = req.params;
    const { danhNumbers, danhAmount, omNumbers, omAmount } = req.body;

    const simIndex = simulations.findIndex(s => s.id == id);
    if (simIndex === -1) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy giả lập.' });
    }
    
    if (simulations[simIndex].hasResult) {
        return res.status(400).json({ success: false, message: 'Không thể sửa giả lập đã có kết quả.' });
    }

    simulations[simIndex] = {
        ...simulations[simIndex],
        danh: {
            numbers: danhNumbers || [],
            amount: parseInt(danhAmount) || 0
        },
        om: {
            numbers: omNumbers || [],
            amount: parseInt(omAmount) || 0
        }
    };

    res.json({ success: true, message: 'Cập nhật giả lập thành công!' });
};

exports.getSimulationStats = (req, res) => {
    // This is a placeholder for more advanced stats in the future
    res.json({ message: "API thống kê giả lập chưa được triển khai." });
};