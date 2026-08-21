"""
Plot the bonding curve exported by scripts/exportCurve.js.
Reads bonding_curve.csv and saves bonding_curve.png.

Run:  python plot_curve.py
(needs matplotlib:  pip install matplotlib)
"""

import csv
import matplotlib.pyplot as plt

supply, price, reserve = [], [], []
with open("bonding_curve.csv") as f:
    for row in csv.DictReader(f):
        supply.append(int(row["supply"]))
        price.append(float(row["price_eth"]))
        reserve.append(float(row["reserve_eth"]))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
fig.suptitle("Lab 6 - Linear Bonding Curve", fontsize=14, fontweight="bold")

# (a) the bonding curve itself: price rises linearly with supply
ax1.plot(supply, price, color="#2e86c1", linewidth=2.2, marker="o", markersize=3)
ax1.set_title("(a) Price = slope x supply + base")
ax1.set_xlabel("Tokens in existence (supply)")
ax1.set_ylabel("Price of next token (ETH)")
ax1.grid(alpha=0.25)

# (b) the reserve: total ETH held grows as the area under the curve
ax2.plot(supply, reserve, color="#e08a1e", linewidth=2.2)
ax2.fill_between(supply, reserve, color="#e08a1e", alpha=0.15)
ax2.set_title("(b) Reserve = ETH held (area under the curve)")
ax2.set_xlabel("Tokens in existence (supply)")
ax2.set_ylabel("Reserve (ETH)")
ax2.grid(alpha=0.25)

fig.tight_layout(rect=(0, 0, 1, 0.95))
fig.savefig("bonding_curve.png", dpi=130)
print("Saved bonding_curve.png")
