<?php

class FactureController {
    public static function handle($method, $id, $body, $db) {
        try {
            if ($method === 'GET' && !$id) {
                // Lister toutes les factures
                $stmt = $db->query("
                    SELECT f.numfact, f.idcli, f.datefact, f.montant, f.statut,
                           c.nom as client_nom, COUNT(lf.numachat) as nb_achats
                    FROM facture f
                    JOIN client c ON f.idcli = c.idcli
                    LEFT JOIN ligne_facture lf ON f.numfact = lf.numfact
                    GROUP BY f.numfact, f.idcli, f.datefact, f.montant, f.statut, c.nom
                    ORDER BY f.datefact DESC
                ");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                
            } elseif ($method === 'GET' && $id) {
                // Détail d'une facture
                $stmt = $db->prepare("
                    SELECT f.*, c.nom as client_nom, c.contact as client_contact
                    FROM facture f JOIN client c ON f.idcli = c.idcli
                    WHERE f.numfact = ?
                ");
                $stmt->execute([$id]);
                $facture = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$facture) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Facture non trouvée']);
                    return;
                }
                
                // Récupérer les lignes
                $stmt = $db->prepare("
                    SELECT a.numachat, a.qte, v.design, v.prix, (a.qte * v.prix) as total
                    FROM ligne_facture lf
                    JOIN achat a ON lf.numachat = a.numachat
                    JOIN voiture v ON a.idvoit = v.idvoit
                    WHERE lf.numfact = ?
                ");
                $stmt->execute([$id]);
                $facture['lignes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode($facture);
                
            } elseif ($method === 'POST') {
                // Créer une facture
                if (!isset($body['idcli']) || !isset($body['achats'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Données invalides']);
                    return;
                }
                
                $db->beginTransaction();
                try {
                    $stmt = $db->query("SELECT COUNT(*) FROM facture");
                    $count = $stmt->fetchColumn() + 1;
                    $numfact = 'FAC-' . date('Ymd') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
                    
                    $stmt = $db->prepare("INSERT INTO facture (numfact, idcli, datefact, montant, statut) VALUES (?, ?, ?, ?, 'EN_ATTENTE')");
                    $stmt->execute([$numfact, $body['idcli'], $body['datefact'] ?? date('Y-m-d'), $body['montant'] ?? 0]);
                    
                    $stmt = $db->prepare("INSERT INTO ligne_facture (numfact, numachat) VALUES (?, ?)");
                    foreach ($body['achats'] as $numachat) {
                        $stmt->execute([$numfact, $numachat]);
                    }
                    
                    $db->commit();
                    
                    $stmt = $db->prepare("
                        SELECT f.*, c.nom as client_nom 
                        FROM facture f JOIN client c ON f.idcli = c.idcli 
                        WHERE f.numfact = ?
                    ");
                    $stmt->execute([$numfact]);
                    
                    http_response_code(201);
                    echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
                
            } elseif ($method === 'DELETE' && $id) {
                // Supprimer une facture
                $db->beginTransaction();
                $stmt = $db->prepare("DELETE FROM ligne_facture WHERE numfact = ?");
                $stmt->execute([$id]);
                $stmt = $db->prepare("DELETE FROM facture WHERE numfact = ?");
                $stmt->execute([$id]);
                $db->commit();
                echo json_encode(['message' => 'Facture supprimée']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
