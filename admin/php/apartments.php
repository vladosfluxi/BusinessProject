<?php
// Load apartment data from JSON file
$jsonFile = '../data/apartments.json';
$apartments = [];
$error = null;

if (file_exists($jsonFile)) {
    $jsonContent = file_get_contents($jsonFile);
    $apartments = json_decode($jsonContent, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        $error = 'Error parsing JSON: ' . json_last_error_msg();
    }
} else {
    $error = 'Apartment data file not found. Expected at: ' . realpath($jsonFile);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apartment Listings</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 40px 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 60px;
            animation: fadeInDown 0.8s ease-out;
        }

        h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            font-size: 1.1rem;
            color: #94a3b8;
            font-weight: 300;
        }

        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 40px;
            text-align: center;
        }

        .apartments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 28px;
            animation: fadeInUp 0.8s ease-out;
        }

        .apartment-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.6));
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            backdrop-filter: blur(10px);
        }

        .apartment-card:hover {
            border-color: rgba(96, 165, 250, 0.4);
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
        }

        .card-image {
            width: 100%;
            height: 220px;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: #475569;
            font-weight: 300;
            overflow: hidden;
            position: relative;
        }

        .card-image::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(96, 165, 250, 0.1), transparent 50%);
        }

        .card-content {
            padding: 28px;
        }

        .apartment-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 12px;
            color: #f1f5f9;
        }

        .apartment-address {
            font-size: 0.95rem;
            color: #cbd5e1;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .apartment-address::before {
            content: '📍';
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .detail-item {
            text-align: center;
        }

        .detail-label {
            font-size: 0.8rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .detail-value {
            font-size: 1.3rem;
            font-weight: 600;
            color: #60a5fa;
        }

        .apartment-description {
            font-size: 0.95rem;
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .price-tag {
            font-size: 1.8rem;
            font-weight: 700;
            color: #10b981;
            display: flex;
            align-items: baseline;
            gap: 4px;
        }

        .price-tag span {
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 400;
        }

        .empty-state {
            text-align: center;
            padding: 80px 40px;
            color: #94a3b8;
        }

        .empty-state h2 {
            font-size: 2rem;
            margin-bottom: 12px;
            color: #cbd5e1;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .apartment-card:nth-child(1) {
            animation: fadeInUp 0.6s ease-out 0.1s both;
        }

        .apartment-card:nth-child(2) {
            animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .apartment-card:nth-child(3) {
            animation: fadeInUp 0.6s ease-out 0.3s both;
        }

        .apartment-card:nth-child(4) {
            animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        .apartment-card:nth-child(n+5) {
            animation: fadeInUp 0.6s ease-out 0.5s both;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2.5rem;
            }

            .apartments-grid {
                grid-template-columns: 1fr;
            }

            body {
                padding: 20px 12px;
            }

            header {
                margin-bottom: 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Find Your Home</h1>
            <p class="subtitle">Browse our curated collection of apartments</p>
        </header>

        <?php if ($error): ?>
            <div class="error-message">
                <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
            </div>
        <?php elseif (empty($apartments)): ?>
            <div class="empty-state">
                <h2>No apartments found</h2>
                <p>The apartment data file is empty or no apartments are available.</p>
            </div>
        <?php else: ?>
            <div class="apartments-grid">
                <?php foreach ($apartments as $apartment): ?>
                    <div class="apartment-card">
                        <div class="card-image">
                            <?php echo isset($apartment['icon']) ? htmlspecialchars($apartment['icon']) : '🏢'; ?>
                        </div>
                        <div class="card-content">
                            <h2 class="apartment-title">
                                <?php echo htmlspecialchars($apartment['title'] ?? 'Apartment'); ?>
                            </h2>
                            
                            <div class="apartment-address">
                                <?php echo htmlspecialchars($apartment['address'] ?? 'Location not specified'); ?>
                            </div>

                            <div class="details-grid">
                                <?php if (isset($apartment['bedrooms'])): ?>
                                    <div class="detail-item">
                                        <div class="detail-label">Bedrooms</div>
                                        <div class="detail-value"><?php echo htmlspecialchars($apartment['bedrooms']); ?></div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if (isset($apartment['bathrooms'])): ?>
                                    <div class="detail-item">
                                        <div class="detail-label">Bathrooms</div>
                                        <div class="detail-value"><?php echo htmlspecialchars($apartment['bathrooms']); ?></div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if (isset($apartment['sqft'])): ?>
                                    <div class="detail-item">
                                        <div class="detail-label">Size</div>
                                        <div class="detail-value"><?php echo htmlspecialchars($apartment['sqft']); ?> ft²</div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if (isset($apartment['year'])): ?>
                                    <div class="detail-item">
                                        <div class="detail-label">Built</div>
                                        <div class="detail-value"><?php echo htmlspecialchars($apartment['year']); ?></div>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <?php if (isset($apartment['description'])): ?>
                                <p class="apartment-description">
                                    <?php echo htmlspecialchars($apartment['description']); ?>
                                </p>
                            <?php endif; ?>

                            <?php if (isset($apartment['price'])): ?>
                                <div class="price-tag">
                                    $<?php echo number_format($apartment['price'], 0); ?>
                                    <span>/month</span>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
